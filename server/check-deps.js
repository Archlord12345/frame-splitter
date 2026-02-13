#!/usr/bin/env node
/**
 * Dependency Checker and Installer for InstantCut Server
 * Vérifie et installe automatiquement les dépendances requises
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function checkCommand(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    
    let stdout = '';
    let stderr = '';
    
    if (proc.stdout) proc.stdout.on('data', (data) => { stdout += data; });
    if (proc.stderr) proc.stderr.on('data', (data) => { stderr += data; });
    
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || `Command failed with code ${code}`));
    });
    
    proc.on('error', reject);
  });
}

async function checkNodeModules() {
  log('\n📦 Vérification des dépendances Node.js...', 'blue');
  
  const rootDir = path.join(__dirname, '..');
  const nodeModulesPath = path.join(rootDir, 'node_modules');
  
  if (!fs.existsSync(nodeModulesPath)) {
    log('   ⚠️  node_modules manquant', 'yellow');
    log('   📥 Installation des dépendances...', 'cyan');
    try {
      await runCommand('npm', ['install'], { cwd: rootDir });
      log('   ✅ Dépendances Node.js installées', 'green');
    } catch (err) {
      log(`   ❌ Erreur: ${err.message}`, 'red');
      return false;
    }
  } else {
    log('   ✅ node_modules présent', 'green');
  }
  return true;
}

async function checkYtDlp() {
  log('\n🎬 Vérification de yt-dlp (pour YouTube)...', 'blue');
  
  if (checkCommand('yt-dlp')) {
    try {
      const version = execSync('yt-dlp --version', { encoding: 'utf8' }).trim();
      log(`   ✅ yt-dlp ${version} installé`, 'green');
      return true;
    } catch {
      // yt-dlp existe mais ne fonctionne pas, on continue
    }
  }
  
  if (checkCommand('youtube-dl')) {
    log('   ✅ youtube-dl installé (fallback)', 'green');
    return true;
  }
  
  log('   ⚠️  yt-dlp non trouvé', 'yellow');
  log('   📥 Tentative d\'installation...', 'cyan');
  
  // Essayer pip3 d'abord
  if (checkCommand('pip3')) {
    try {
      await runCommand('pip3', ['install', 'yt-dlp', '--break-system-packages'], { silent: true });
      log('   ✅ yt-dlp installé via pip3', 'green');
      return true;
    } catch {
      log('   ⚠️  pip3 a échoué, tentative avec pip...', 'yellow');
    }
  }
  
  // Essayer pip
  if (checkCommand('pip')) {
    try {
      await runCommand('pip', ['install', 'yt-dlp', '--break-system-packages'], { silent: true });
      log('   ✅ yt-dlp installé via pip', 'green');
      return true;
    } catch {
      log('   ⚠️  pip a échoué', 'yellow');
    }
  }
  
  // Essayer apt (Ubuntu/Debian)
  if (checkCommand('apt')) {
    try {
      log('   📥 Tentative avec apt...', 'cyan');
      await runCommand('sudo', ['apt', 'update'], { silent: true });
      await runCommand('sudo', ['apt', 'install', '-y', 'yt-dlp'], { silent: true });
      if (checkCommand('yt-dlp')) {
        log('   ✅ yt-dlp installé via apt', 'green');
        return true;
      }
    } catch {
      log('   ⚠️  apt a échoué', 'yellow');
    }
  }
  
  log('   ❌ Impossible d\'installer yt-dlp automatiquement', 'red');
  log('   💡 Installez manuellement: pip install yt-dlp', 'yellow');
  return false;
}

async function checkFfmpeg() {
  log('\n🎥 Vérification de FFmpeg...', 'blue');
  
  try {
    // ffmpeg-static est déjà une dépendance npm
    require('ffmpeg-static');
    log('   ✅ ffmpeg-static (Node) installé', 'green');
    return true;
  } catch {
    log('   ⚠️  ffmpeg-static manquant', 'yellow');
    return false;
  }
}

async function main() {
  log('╔══════════════════════════════════════════╗', 'cyan');
  log('║     InstantCut - Vérification des deps     ║', 'cyan');
  log('╚══════════════════════════════════════════╝', 'cyan');
  
  const results = {
    nodeModules: await checkNodeModules(),
    ytDlp: await checkYtDlp(),
    ffmpeg: await checkFfmpeg()
  };
  
  log('\n═══════════════════════════════════════════', 'cyan');
  log('Résumé:', 'blue');
  log(`  Node.js modules: ${results.nodeModules ? '✅' : '❌'}`, results.nodeModules ? 'green' : 'red');
  log(`  yt-dlp (YouTube): ${results.ytDlp ? '✅' : '⚠️'}`, results.ytDlp ? 'green' : 'yellow');
  log(`  FFmpeg: ${results.ffmpeg ? '✅' : '❌'}`, results.ffmpeg ? 'green' : 'red');
  log('═══════════════════════════════════════════\n', 'cyan');
  
  if (!results.nodeModules) {
    log('❌ Impossible de continuer sans node_modules', 'red');
    process.exit(1);
  }
  
  if (!results.ytDlp) {
    log('⚠️  YouTube ne fonctionnera pas sans yt-dlp', 'yellow');
    log('   Les liens directs fonctionneront toujours.\n', 'cyan');
  }
  
  // Mettre à jour le PATH si yt-dlp a été installé dans ~/.local/bin
  const localBin = path.join(require('os').homedir(), '.local', 'bin');
  if (fs.existsSync(localBin) && !process.env.PATH.includes(localBin)) {
    process.env.PATH = `${localBin}:${process.env.PATH}`;
    log(`🔧 PATH mis à jour: ${localBin}`, 'cyan');
  }
  
  log('✅ Vérification terminée!\n', 'green');
}

// Si exécuté directement
if (require.main === module) {
  main().catch(err => {
    log(`\n❌ Erreur: ${err.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { main, checkCommand, runCommand };
