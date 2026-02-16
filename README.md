# Welcome To instantcut

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

### **Frontend Framework & Build Tools**
- **React 18.3.1** - UI framework with hooks
- **TypeScript 5.8.3** - Type-safe JavaScript
- **Vite 5.4.19** - Fast build tool and dev server
- **React Router DOM 6.30.1** - Client-side routing

### **UI Components & Styling**
- **shadcn/ui** - Modern component library
- **Radix UI** - Headless UI components (accordion, dialog, slider, etc.)
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Lucide React 0.462.0** - Icon library
- **next-themes 0.3.0** - Dark/light mode support
- **Tailwind CSS Animate 1.0.7** - Animation utilities

### **Backend & Server**
- **Node.js** - JavaScript runtime
- **Express 5.2.1** - Web framework
- **CORS 2.8.6** - Cross-origin resource sharing
- **Multer 2.0.2** - File upload middleware

### **Media Processing**
- **FFmpeg 5.3.0** - Video/audio processing
- **Fluent FFmpeg 2.1.3** - FFmpeg wrapper for Node.js
- **yt-dlp** - YouTube/media downloader (system dependency)

### **Audio/Video Handling**
- **WaveSurfer.js 7.12.1** - Audio waveform visualization
- **HTML5 Video/Audio APIs** - Browser media playback

### **File Management & Utilities**
- **JSZip 3.10.1** - ZIP file creation
- **File Saver 2.0.5** - File downloads
- **Date-fns 3.6.0** - Date manipulation

### **State Management & Data**
- **React Hook Form 7.61.1** - Form handling
- **Zod 3.25.76** - Schema validation
- **TanStack Query 5.83.0** - Server state management

### **Development Tools**
- **ESLint 9.32.0** - Code linting
- **Vitest 3.2.4** - Unit testing
- **React Testing Library** - Component testing
- **Concurrently 9.2.1** - Run multiple scripts
- **TypeScript ESLint** - TypeScript linting

### **Additional Libraries**
- **Class Variance Authority 0.7.1** - Component variant management
- **clsx 2.1.1** - Conditional className utility
- **Tailwind Merge 2.6.0** - Tailwind class merging
- **Sonner 1.7.4** - Toast notifications
- **React Resizable Panels 2.1.9** - Resizable layouts
- **Embla Carousel 8.6.0** - Carousel component
- **Recharts 2.15.4** - Chart library

### **Key Features**
- **Video/Audio trimming** with visual timeline
- **Frame extraction** from media files
- **YouTube/media URL** download support
- **Real-time preview** with drag & drop
- **Session-based** file management
- **Responsive design** with dark mode
- **Type-safe** development with TypeScript
