const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const ffmpegPath = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const https = require('https');
const http = require('http');
const { spawn } = require('child_process');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const port = 3001;

// Session tracking for auto-cleanup
const sessions = new Map(); // sessionId -> { files: [], lastActivity: timestamp }
const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Cleanup function
function cleanupSession(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) return;
  
  console.log(`[Cleanup] Cleaning up session: ${sessionId}`);
  
  for (const filePath of session.files) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[Cleanup] Deleted: ${filePath}`);
      }
      // Also cleanup parent directory if it's a frames directory
      const parentDir = path.dirname(filePath);
      if (parentDir.includes('frames-') && fs.existsSync(parentDir)) {
        fs.rmSync(parentDir, { recursive: true, force: true });
        console.log(`[Cleanup] Deleted directory: ${parentDir}`);
      }
    } catch (err) {
      console.error(`[Cleanup] Error deleting ${filePath}:`, err.message);
    }
  }
  
  sessions.delete(sessionId);
}

// Periodic cleanup of inactive sessions
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      console.log(`[Cleanup] Session ${sessionId} expired`);
      cleanupSession(sessionId);
    }
  }
}, 60 * 1000); // Check every minute

app.use(cors());
app.use(express.json());

// Serve uploads with proper headers for video playback
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  next();
}, express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// Download file from URL
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    const file = fs.createWriteStream(destPath);
    
    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        return downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(destPath);
      });
    }).on('error', reject);
  });
}

// --- Endpoints ---

// Simple upload with session tracking
app.post('/api/upload', upload.single('media'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const sessionId = req.headers['x-session-id'] || 'default';
  
  // Track file for this session
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, { files: [], lastActivity: Date.now() });
  }
  const session = sessions.get(sessionId);
  session.files.push(req.file.path);
  session.lastActivity = Date.now();
  
  res.json({
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`,
    fullPath: req.file.path,
    sessionId,
  });
});

// Heartbeat to keep session alive
app.post('/api/heartbeat', (req, res) => {
  const sessionId = req.headers['x-session-id'] || 'default';
  const session = sessions.get(sessionId);
  if (session) {
    session.lastActivity = Date.now();
  }
  res.json({ ok: true });
});

// Manual cleanup endpoint
app.post('/api/cleanup', (req, res) => {
  const sessionId = req.headers['x-session-id'] || 'default';
  cleanupSession(sessionId);
  res.json({ ok: true, message: 'Session cleaned up' });
});

// Download from URL (handles YouTube via yt-dlp if available, or direct downloads)
app.post('/api/download-url', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Missing URL' });
  
  const sessionId = req.headers['x-session-id'] || 'default';
  
  try {
    const parsed = new URL(url);
    const isYouTube = parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be');
    
    let outputFilename;
    let outputPath;
    
    if (isYouTube) {
      // Try to use yt-dlp if available
      try {
        const rawFilename = `yt-raw-${Date.now()}.mp4`;
        const rawPath = path.join(__dirname, 'uploads', rawFilename);
        outputFilename = `yt-${Date.now()}.mp4`;
        outputPath = path.join(__dirname, 'uploads', outputFilename);
        
        await new Promise((resolve, reject) => {
          const ytdlp = spawn('yt-dlp', [
            '-f', 'best[height<=720]',
            '-o', rawPath,
            '--no-playlist',
            url
          ]);
          
          ytdlp.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`yt-dlp exited with code ${code}`));
          });
          
          ytdlp.on('error', () => {
            reject(new Error('yt-dlp not available'));
          });
        });
        
        // Convert to H.264 for browser compatibility
        console.log('[Download] Converting to H.264 for browser compatibility...');
        await new Promise((resolve, reject) => {
          ffmpeg(rawPath)
            .outputOptions([
              '-c:v libx264',
              '-c:a aac',
              '-movflags +faststart',
              '-preset fast',
              '-crf 23'
            ])
            .output(outputPath)
            .on('end', () => {
              // Remove raw file after conversion
              try {
                fs.unlinkSync(rawPath);
              } catch (e) {
                console.log('[Download] Could not remove raw file:', e.message);
              }
              resolve();
            })
            .on('error', (err) => {
              console.error('[Download] FFmpeg conversion error:', err);
              // Fallback to raw file if conversion fails
              fs.renameSync(rawPath, outputPath);
              resolve();
            })
            .run();
        });
        
      } catch (ytdlpError) {
        // Fallback: try youtube-dl
        try {
          const rawFilename = `yt-raw-${Date.now()}.mp4`;
          const rawPath = path.join(__dirname, 'uploads', rawFilename);
          outputFilename = `yt-${Date.now()}.mp4`;
          outputPath = path.join(__dirname, 'uploads', outputFilename);
          
          await new Promise((resolve, reject) => {
            const ytdl = spawn('youtube-dl', [
              '-f', 'best[height<=720]',
              '-o', rawPath,
              '--no-playlist',
              url
            ]);
            
            ytdl.on('close', (code) => {
              if (code === 0) resolve();
              else reject(new Error(`youtube-dl exited with code ${code}`));
            });
            
            ytdl.on('error', () => {
              reject(new Error('youtube-dl not available'));
            });
          });
          
          // Convert to H.264 for browser compatibility
          console.log('[Download] Converting to H.264 for browser compatibility...');
          await new Promise((resolve, reject) => {
            ffmpeg(rawPath)
              .outputOptions([
                '-c:v libx264',
                '-c:a aac',
                '-movflags +faststart',
                '-preset fast',
                '-crf 23'
              ])
              .output(outputPath)
              .on('end', () => {
                try {
                  fs.unlinkSync(rawPath);
                } catch (e) {
                  console.log('[Download] Could not remove raw file:', e.message);
                }
                resolve();
              })
              .on('error', (err) => {
                console.error('[Download] FFmpeg conversion error:', err);
                fs.renameSync(rawPath, outputPath);
                resolve();
              })
              .run();
          });
          
        } catch (ytdlError) {
          return res.status(400).json({ 
            error: 'YouTube videos require yt-dlp or youtube-dl to be installed',
            hint: 'Install with: pip install yt-dlp'
          });
        }
      }
    } else {
      // Direct download for non-YouTube URLs
      outputFilename = `download-${Date.now()}.mp4`;
      outputPath = path.join(__dirname, 'uploads', outputFilename);
      
      try {
        await downloadFile(url, outputPath);
      } catch (downloadError) {
        return res.status(400).json({ 
          error: 'Failed to download from URL',
          details: downloadError.message 
        });
      }
    }
    
    // Track file for cleanup
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, { files: [], lastActivity: Date.now() });
    }
    const session = sessions.get(sessionId);
    session.files.push(outputPath);
    session.lastActivity = Date.now();
    
    res.json({
      filename: outputFilename,
      path: `/uploads/${outputFilename}`,
      fullPath: outputPath,
      sessionId,
      source: isYouTube ? 'youtube' : 'direct'
    });
    
  } catch (error) {
    console.error('[Download URL] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const tasks = new Map();

// SSE progress endpoint
app.get('/api/progress/:taskId', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const taskId = req.params.taskId;
  const timer = setInterval(() => {
    const progress = tasks.get(taskId);
    if (progress !== undefined) {
      res.write(`data: ${JSON.stringify({ progress })}\n\n`);
      if (progress >= 100) {
        clearInterval(timer);
        res.end();
      }
    }
  }, 100);

  req.on('close', () => {
    clearInterval(timer);
  });
});

// Trim media
app.post('/api/trim', (req, res) => {
  const { filename, startTime, duration, isAudio } = req.body;
  if (!filename) return res.status(400).json({ error: 'Missing filename' });

  const taskId = `trim-${Date.now()}`;
  tasks.set(taskId, 0);

  const inputPath = path.join(__dirname, 'uploads', filename);
  const outputFilename = `trimmed-${Date.now()}-${filename}`;
  const outputPath = path.join(__dirname, 'uploads', outputFilename);

  ffmpeg(inputPath)
    .setStartTime(startTime)
    .setDuration(duration)
    .outputOptions([
      '-threads 0',
      '-preset ultrafast',
      '-c:v libx264',
      '-crf 22'
    ])
    .output(outputPath)
    .on('progress', (progress) => {
      if (progress.percent !== undefined) {
        tasks.set(taskId, Math.min(99, Math.max(0, progress.percent)));
      }
    })
    .on('end', () => {
      tasks.set(taskId, 100);
      res.json({
        filename: outputFilename,
        path: `/uploads/${outputFilename}`,
        taskId,
      });
    })
    .on('error', (err) => {
      console.error(err);
      tasks.delete(taskId);
      res.status(500).json({ error: 'FFmpeg trim error' });
    })
    .run();
});

// Extract frames
app.post('/api/extract-frames', (req, res) => {
  const { filename, mode, interval, count, duration } = req.body;
  if (!filename) return res.status(400).json({ error: 'Missing filename' });

  const taskId = `extract-${Date.now()}`;
  tasks.set(taskId, 0);

  const inputPath = path.join(__dirname, 'uploads', filename);
  const outputDir = path.join(__dirname, 'uploads', `frames-${Date.now()}`);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  let cmd = ffmpeg(inputPath).outputOptions('-threads 0');

  const filters = [];
  if (mode === 'interval') {
    filters.push(`fps=1/${interval}`);
  } else {
    const fps = count / (duration || 1);
    filters.push(`fps=${fps}`);
  }
  // Optimization: Scale down to 480px width for much faster thumbnail generation
  filters.push('scale=480:-1');

  cmd = cmd.outputOptions(['-vf', filters.join(',')]);

  cmd
    .output(path.join(outputDir, 'frame-%03d.png'))
    .on('progress', (progress) => {
      if (progress.percent !== undefined) {
        tasks.set(taskId, Math.min(99, Math.max(0, progress.percent)));
      }
    })
    .on('end', () => {
      const files = fs.readdirSync(outputDir);
      const frames = files.map((file, index) => ({
        id: `f-${Date.now()}-${index}`,
        timestamp: mode === 'interval' ? index * interval : (index * (duration || 0)) / count,
        dataUrl: `http://localhost:${port}/uploads/${path.basename(outputDir)}/${file}`,
        selected: true,
      }));
      tasks.set(taskId, 100);
      res.json({ frames, taskId });
    })
    .on('error', (err) => {
      console.error(err);
      tasks.delete(taskId);
      res.status(500).json({ error: 'FFmpeg extraction error' });
    })
    .run();
});

// Serve the frames as well
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start server
app.listen(port, () => {
  console.log(`\n🚀 Media server running at http://localhost:${port}`);
  console.log('✅ Server is ready to accept connections\n');
});
