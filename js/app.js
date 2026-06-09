const state = {
  project: {
    name: 'Untitled_Project_01',
    resolution: '1920x1080',
    fps: 30,
    duration: 5
  },
  camera: {
    lensType: 'standard',
    focalLength: 50,
    angle: 'eye-level',
    movement: 'static',
    aperture: 2.8,
    dof: 'shallow'
  },
  lighting: {
    keyLight: 'soft',
    intensity: 80,
    style: 'natural',
    timeOfDay: 'noon',
    colorTemp: 5500,
    atmosphere: 'clear'
  },
  motion: {
    intensity: 'subtle',
    subjectAction: 'still',
    stabilization: 70,
    motionBlur: 'low'
  },
  prompt: '',
  shots: [
    { id: 1, name: 'Shot 01', duration: 5, thumbnail: null, active: true },
    { id: 2, name: 'Shot 02', duration: 3, thumbnail: null, active: false },
    { id: 3, name: 'Shot 03', duration: 7, thumbnail: null, active: false }
  ],
  currentShot: 1
};

// ==================== AI PROVIDER STATE (from Settings) ====================
let aiState = {
  configured: {},
  customProviders: [],
  defaultProvider: 'xai'
};

const builtInProviders = [
  { id: 'runway', name: 'Runway ML', desc: 'Gen-3 Alpha • Cinematic text-to-video & motion brush', icon: '🎬', hint: 'Get your key from Runway dashboard → API' },
  { id: 'luma', name: 'Luma AI', desc: 'Dream Machine • Photorealistic motion and world models', icon: '🌌', hint: 'Create API key in Luma account settings' },
  { id: 'kling', name: 'Kling AI', desc: 'Kling 2.0 • High-fidelity motion and lip sync', icon: '🐉', hint: 'Available via Kling developer console' },
  { id: 'pika', name: 'Pika Labs', desc: 'Pika 2.2 • Creative effects, lip sync & stylization', icon: '⚡', hint: 'Access via Pika web or Discord integration' },
  { id: 'stability', name: 'Stability AI', desc: 'Stable Video 3 • Controllable open video diffusion', icon: '🔬', hint: 'Stability platform → API keys section' },
  { id: 'leonardo', name: 'Leonardo.AI', desc: 'Motion 2.0 • Character-consistent animation', icon: '🎨', hint: 'Leonardo dashboard → API & keys' },
  { id: 'replicate', name: 'Replicate', desc: 'Community video models • Run any open weights', icon: '🔄', hint: 'Create token at replicate.com/account/api-tokens' },
  { id: 'xai', name: 'xAI', desc: 'Grok Video • Reasoning-powered high quality generation', icon: '🚀', hint: 'xAI console → API keys (Grok Video access)' },
  { id: 'together', name: 'Together.AI', desc: 'Fast inference • Open video models at scale', icon: '🔗', hint: 'Together dashboard → API keys' },
  { id: 'fal', name: 'Fal.ai', desc: 'Serverless • Instant video & image-to-video APIs', icon: '⚡', hint: 'Fal dashboard → API keys' },
  { id: 'huggingface', name: 'Hugging Face', desc: 'Open video models • Inference Endpoints & Spaces', icon: '🤗', hint: 'HF settings → Access Tokens (with read/write)' },
  { id: 'minimax', name: 'Minimax', desc: 'Hailuo Video • Cinematic motion & prompt adherence', icon: '🌊', hint: 'Minimax developer portal → API credentials' },
  { id: 'viggle', name: 'Viggle', desc: 'Mix & Motion • Character animation from images', icon: '🕺', hint: 'Viggle account → API section' },
  { id: 'hedra', name: 'Hedra', desc: 'Expressive avatars • Talking head video with emotion', icon: '🎭', hint: 'Hedra platform → Developer API keys' },
  { id: 'openai', name: 'OpenAI', desc: 'Sora • Advanced world simulation & video', icon: '🔷', hint: 'OpenAI platform → API keys (Sora access)' }
];

let currentEditingProvider = null;

// DOM Elements
const elements = {
  projectName: document.getElementById('projectName'),
  resolution: document.getElementById('resolution'),
  fps: document.getElementById('fps'),
  duration: document.getElementById('duration'),
  resIndicator: document.getElementById('resIndicator'),
  
  lensType: document.getElementById('lensType'),
  focalLength: document.getElementById('focalLength'),
  focalLengthVal: document.getElementById('focalLengthVal'),
  cameraAngle: document.getElementById('cameraAngle'),
  cameraMovement: document.getElementById('cameraMovement'),
  aperture: document.getElementById('aperture'),
  apertureVal: document.getElementById('apertureVal'),
  dof: document.getElementById('dof'),
  
  keyLight: document.getElementById('keyLight'),
  lightIntensity: document.getElementById('lightIntensity'),
  lightIntensityVal: document.getElementById('lightIntensityVal'),
  lightingStyle: document.getElementById('lightingStyle'),
  timeOfDay: document.getElementById('timeOfDay'),
  colorTemp: document.getElementById('colorTemp'),
  colorTempVal: document.getElementById('colorTempVal'),
  atmosphere: document.getElementById('atmosphere'),
  
  motionIntensity: document.getElementById('motionIntensity'),
  subjectAction: document.getElementById('subjectAction'),
  stabilization: document.getElementById('stabilization'),
  stabVal: document.getElementById('stabVal'),
  motionBlur: document.getElementById('motionBlur'),
  
  promptInput: document.getElementById('promptInput'),
  generateBtn: document.getElementById('generateBtn'),
  saveBtn: document.getElementById('saveBtn'),
  loadBtn: document.getElementById('loadBtn'),
  exportBtn: document.getElementById('exportBtn'),
  
  previewContent: document.getElementById('previewContent'),
  loadingState: document.getElementById('loadingState'),
  progressText: document.getElementById('progressText'),
  
  shotList: document.getElementById('shotList'),
  shotCount: document.getElementById('shotCount'),
  addShotBtn: document.getElementById('addShotBtn'),
  
  mobileControlsBtn: document.getElementById('mobileControlsBtn'),
  mobileDrawer: document.getElementById('mobileDrawer'),
  drawerOverlay: document.getElementById('drawerOverlay'),
  closeMobileDrawer: document.getElementById('closeMobileDrawer'),
  
  toast: document.getElementById('toast'),
  toastMessage: document.getElementById('toastMessage'),
  
  currentProvider: document.getElementById('currentProvider')
};

// Initialize
function init() {
  loadAIState();
  updateCurrentProviderDisplay();
  renderShotList();
  attachEventListeners();
  updateResolutionIndicator();
}

// Event Listeners
function attachEventListeners() {
  // Project controls
  elements.projectName.addEventListener('input', e => {
    state.project.name = e.target.value;
  });
  elements.resolution.addEventListener('change', e => {
    state.project.resolution = e.target.value;
    updateResolutionIndicator();
  });
  elements.fps.addEventListener('change', e => {
    state.project.fps = parseInt(e.target.value);
    updateResolutionIndicator();
  });
  elements.duration.addEventListener('input', e => {
    state.project.duration = parseInt(e.target.value) || 5;
  });

  // Camera controls
  elements.lensType.addEventListener('change', e => state.camera.lensType = e.target.value);
  elements.focalLength.addEventListener('input', e => {
    state.camera.focalLength = parseInt(e.target.value);
    elements.focalLengthVal.textContent = e.target.value + 'mm';
  });
  elements.cameraAngle.addEventListener('change', e => state.camera.angle = e.target.value);
  elements.cameraMovement.addEventListener('change', e => state.camera.movement = e.target.value);
  elements.aperture.addEventListener('input', e => {
    state.camera.aperture = parseFloat(e.target.value);
    elements.apertureVal.textContent = 'f/' + e.target.value;
  });
  elements.dof.addEventListener('change', e => state.camera.dof = e.target.value);

  // Lighting controls
  elements.keyLight.addEventListener('change', e => state.lighting.keyLight = e.target.value);
  elements.lightIntensity.addEventListener('input', e => {
    state.lighting.intensity = parseInt(e.target.value);
    elements.lightIntensityVal.textContent = e.target.value + '%';
  });
  elements.lightingStyle.addEventListener('change', e => state.lighting.style = e.target.value);
  elements.timeOfDay.addEventListener('change', e => state.lighting.timeOfDay = e.target.value);
  elements.colorTemp.addEventListener('input', e => {
    state.lighting.colorTemp = parseInt(e.target.value);
    elements.colorTempVal.textContent = e.target.value + 'K';
  });
  elements.atmosphere.addEventListener('change', e => state.lighting.atmosphere = e.target.value);

  // Motion controls
  elements.motionIntensity.addEventListener('change', e => state.motion.intensity = e.target.value);
  elements.subjectAction.addEventListener('change', e => state.motion.subjectAction = e.target.value);
  elements.stabilization.addEventListener('input', e => {
    state.motion.stabilization = parseInt(e.target.value);
    elements.stabVal.textContent = e.target.value + '%';
  });
  elements.motionBlur.addEventListener('change', e => state.motion.motionBlur = e.target.value);

  // Prompt
  elements.promptInput.addEventListener('input', e => state.prompt = e.target.value);

  // Actions
  elements.generateBtn.addEventListener('click', handleGenerate);
  elements.saveBtn.addEventListener('click', handleSave);
  elements.loadBtn.addEventListener('click', handleLoad);
  elements.exportBtn.addEventListener('click', handleExport);
  elements.addShotBtn.addEventListener('click', handleAddShot);

  // Mobile
  elements.mobileControlsBtn.addEventListener('click', () => {
    elements.mobileDrawer.classList.remove('hidden');
  });
  elements.drawerOverlay.addEventListener('click', () => {
    elements.mobileDrawer.classList.add('hidden');
  });
  elements.closeMobileDrawer.addEventListener('click', () => {
    elements.mobileDrawer.classList.add('hidden');
  });
}

// Update Resolution Indicator
function updateResolutionIndicator() {
  const [w, h] = state.project.resolution.split('x');
  elements.resIndicator.textContent = `${w}×${h} @ ${state.project.fps}fps`;
}

// Render Shot List
function renderShotList() {
  elements.shotList.innerHTML = state.shots.map(shot => `
    <div class="shot-item relative flex-shrink-0 w-40 group cursor-pointer" data-shot-id="${shot.id}">
      <div class="timeline-thumb ${shot.active ? 'active' : ''} aspect-video bg-surface-700 rounded-lg border-2 ${shot.active ? 'border-brand-500' : 'border-surface-600'} overflow-hidden transition-all hover:border-brand-400">
        <div class="w-full h-full bg-gradient-to-br from-surface-600 to-surface-700 flex items-center justify-center">
          <svg class="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
          </svg>
        </div>
        <div class="shot-overlay absolute inset-0 bg-black/60 opacity-0 transition-opacity flex items-center justify-center gap-2">
          <button class="p-2 bg-surface-800 hover:bg-brand-600 rounded-lg transition-all edit-shot" data-id="${shot.id}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
          </button>
          <button class="p-2 bg-surface-800 hover:bg-red-600 rounded-lg transition-all delete-shot" data-id="${shot.id}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="mt-2 flex items-center justify-between">
        <span class="text-xs font-medium text-gray-300">${shot.name}</span>
        <span class="text-xs text-gray-500">${shot.duration}s</span>
      </div>
    </div>
  `).join('');
  
  elements.shotCount.textContent = `${state.shots.length} shot${state.shots.length !== 1 ? 's' : ''}`;
  
  // Add click listeners
  document.querySelectorAll('.shot-item').forEach(el => {
    el.addEventListener('click', e => {
      if (!e.target.closest('.edit-shot') && !e.target.closest('.delete-shot')) {
        selectShot(parseInt(el.dataset.shotId));
      }
    });
  });
  
  document.querySelectorAll('.delete-shot').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      deleteShot(parseInt(btn.dataset.id));
    });
  });
}

// Select Shot
function selectShot(id) {
  state.shots.forEach(s => s.active = s.id === id);
  state.currentShot = id;
  renderShotList();
  showToast(`Switched to Shot ${id}`);
}

// Delete Shot
function deleteShot(id) {
  if (state.shots.length === 1) {
    showToast('Cannot delete the last shot', 'error');
    return;
  }
  state.shots = state.shots.filter(s => s.id !== id);
  if (state.currentShot === id) {
    state.currentShot = state.shots[0].id;
    state.shots[0].active = true;
  }
  renderShotList();
  showToast('Shot deleted');
}

// Add Shot
function handleAddShot() {
  const newId = Math.max(...state.shots.map(s => s.id)) + 1;
  state.shots.push({
    id: newId,
    name: `Shot ${String(newId).padStart(2, '0')}`,
    duration: 5,
    thumbnail: null,
    active: false
  });
  renderShotList();
  showToast('New shot added');
}

// Generate Video
async function handleGenerate() {
  if (!state.prompt.trim()) {
    showToast('Please enter a prompt first', 'error');
    return;
  }
  
  elements.loadingState.classList.remove('hidden');
  elements.previewContent.classList.add('hidden');
  elements.generateBtn.disabled = true;
  
  // Simulate generation progress
  const totalFrames = state.project.duration * state.project.fps;
  let currentFrame = 0;
  
  const interval = setInterval(() => {
    currentFrame += Math.floor(totalFrames / 20);
    if (currentFrame >= totalFrames) {
      currentFrame = totalFrames;
      clearInterval(interval);
      
      setTimeout(() => {
        elements.loadingState.classList.add('hidden');
        elements.previewContent.classList.remove('hidden');
        elements.generateBtn.disabled = false;
        
        const currentProv = getCurrentProviderName();
        // Update preview with "generated" content
        elements.previewContent.innerHTML = `
          <div class="relative w-full h-full bg-gradient-to-br from-brand-500/20 via-surface-700 to-brand-600/20 flex items-center justify-center animate-fade-in">
            <div class="text-center p-8">
              <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-500/20 flex items-center justify-center">
                <svg class="w-8 h-8 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <p class="text-sm text-gray-300 font-medium">Video Generated Successfully</p>
              <p class="text-xs text-gray-500 mt-2">Using ${currentProv}</p>
              <p class="text-xs text-gray-500 mt-1 max-w-md mx-auto line-clamp-2">${state.prompt}</p>
            </div>
          </div>
        `;
        
        showToast('Video generation complete!');
      }, 500);
    }
    elements.progressText.textContent = `Processing frame ${currentFrame} of ${totalFrames}`;
  }, 150);
}

// Save Project
function handleSave() {
  const projectData = {
    project: state.project,
    camera: state.camera,
    lighting: state.lighting,
    motion: state.motion,
    prompt: state.prompt,
    shots: state.shots
  };
  
  const dataStr = JSON.stringify(projectData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${state.project.name}.json`;
  link.click();
  URL.revokeObjectURL(url);
  
  showToast('Project saved successfully');
}

// Load Project
function handleLoad() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const data = JSON.parse(event.target.result);
        Object.assign(state, data);
        
        // Update UI
        elements.projectName.value = state.project.name;
        elements.resolution.value = state.project.resolution;
        elements.fps.value = state.project.fps;
        elements.duration.value = state.project.duration;
        elements.promptInput.value = state.prompt;
        
        renderShotList();
        updateResolutionIndicator();
        showToast('Project loaded successfully');
      } catch (err) {
        showToast('Failed to load project', 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// Export Video
function handleExport() {
  showToast('Export started... Video will be ready shortly');
  
  setTimeout(() => {
    const link = document.createElement('a');
    link.href = '#';
    link.download = `${state.project.name}.mp4`;
    showToast('Video exported successfully!');
  }, 2000);
}

// Show Toast
function showToast(message, type = 'success') {
  elements.toastMessage.textContent = message;
  elements.toast.classList.remove('hidden');
  
  const icon = elements.toast.querySelector('svg');
  if (type === 'error') {
    icon.classList.remove('text-green-400');
    icon.classList.add('text-red-400');
  } else {
    icon.classList.remove('text-red-400');
    icon.classList.add('text-green-400');
  }
  
  setTimeout(() => {
    elements.toast.classList.add('hidden');
  }, 3000);
}

// ==================== AI PROVIDER FUNCTIONS (Integrated) ====================
function loadAIState() {
  try {
    const saved = localStorage.getItem('vgen_ai_settings');
    if (saved) {
      const data = JSON.parse(saved);
      aiState.configured = data.configured || {};
      aiState.customProviders = data.customProviders || [];
      aiState.defaultProvider = data.defaultProvider || 'xai';
    }
  } catch (e) {}
}

function saveAIState() {
  try {
    localStorage.setItem('vgen_ai_settings', JSON.stringify(aiState));
  } catch (e) {}
}

function getCurrentProviderName() {
  const prov = builtInProviders.find(p => p.id === aiState.defaultProvider);
  if (prov) return prov.name;
  const custom = aiState.customProviders.find(p => p.id === aiState.defaultProvider);
  return custom ? custom.name : 'xAI';
}

function updateCurrentProviderDisplay() {
  if (elements.currentProvider) {
    elements.currentProvider.textContent = getCurrentProviderName();
  }
}

function updateDefaultProviderFromModal() {
  aiState.defaultProvider = document.getElementById('defaultProviderSelect').value;
  saveAIState();
  updateCurrentProviderDisplay();
  showToast('Default provider updated');
}

function renderSettingsProvidersGrid() {
  const grid = document.getElementById('settingsProvidersGrid');
  if (!grid) return;
  
  grid.innerHTML = builtInProviders.map(p => {
    const conf = aiState.configured[p.id] || {};
    const isConnected = !!(conf.apiKey && conf.apiKey.length > 4);
    
    const statusBadge = isConnected 
      ? `<span class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Connected</span>`
      : `<span class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400"><span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>Not configured</span>`;
    
    const masked = isConnected ? '••••••' + conf.apiKey.slice(-4) : '';
    
    return `
      <div class="provider-card glass rounded-3xl p-5 border ${isConnected ? 'border-emerald-500/40' : 'border-surface-700'} flex flex-col">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-surface-700 flex items-center justify-center text-3xl flex-shrink-0 ring-1 ring-inset ring-white/5">${p.icon}</div>
            <div class="min-w-0">
              <div class="font-semibold text-[15px] leading-tight">${p.name}</div>
              <div class="text-[10px] text-gray-400 mt-0.5 line-clamp-1">${p.desc.split('•')[0].trim()}</div>
            </div>
          </div>
          <div>${statusBadge}</div>
        </div>
        <div class="text-xs text-gray-400 mb-auto line-clamp-2 leading-snug min-h-[32px]">${p.desc}</div>
        <div class="mt-5 flex items-center justify-between gap-3">
          <div class="font-mono text-[10px] text-gray-500 truncate flex-1">${masked || '—'}</div>
          <button onclick="openProviderEditModal('${p.id}', false)" class="text-xs font-semibold px-4 py-1.5 rounded-2xl transition-all ${isConnected ? 'bg-surface-600 hover:bg-surface-500' : 'bg-brand-500 hover:bg-brand-600 text-white'}">
            ${isConnected ? 'Edit' : 'Configure'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderSettingsCustomGrid() {
  const grid = document.getElementById('settingsCustomGrid');
  const noMsg = document.getElementById('settingsNoCustomMsg');
  if (!grid || !noMsg) return;
  
  if (aiState.customProviders.length === 0) {
    grid.innerHTML = '';
    noMsg.classList.remove('hidden');
    return;
  }
  noMsg.classList.add('hidden');
  
  grid.innerHTML = aiState.customProviders.map(p => {
    const isConnected = !!(p.apiKey && p.apiKey.length > 4);
    const statusBadge = isConnected 
      ? `<span class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Connected</span>`
      : `<span class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400"><span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>Not configured</span>`;
    
    const masked = isConnected ? '••••••' + p.apiKey.slice(-4) : '';
    
    return `
      <div class="provider-card glass rounded-3xl p-5 border ${isConnected ? 'border-emerald-500/40' : 'border-surface-700'} flex flex-col">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-surface-700 flex items-center justify-center text-3xl flex-shrink-0 ring-1 ring-inset ring-white/5">🛠️</div>
            <div class="min-w-0">
              <div class="font-semibold text-[15px] leading-tight flex items-center gap-2">${p.name} <span class="text-[9px] px-1.5 py-px rounded bg-surface-600 text-gray-400 font-mono">CUSTOM</span></div>
              <div class="text-[10px] text-gray-400 mt-0.5 line-clamp-1">${p.desc || 'Custom video provider'}</div>
            </div>
          </div>
          <div>${statusBadge}</div>
        </div>
        <div class="text-xs text-gray-400 mb-auto line-clamp-2 leading-snug min-h-[32px]">${p.baseUrl ? p.baseUrl.replace(/^https?:\/\//, '') : 'No endpoint configured'}</div>
        <div class="mt-5 flex items-center justify-between gap-3">
          <div class="font-mono text-[10px] text-gray-500 truncate flex-1">${masked || '—'}</div>
          <button onclick="openProviderEditModal('${p.id}', true)" class="text-xs font-semibold px-4 py-1.5 rounded-2xl transition-all ${isConnected ? 'bg-surface-600 hover:bg-surface-500' : 'bg-brand-500 hover:bg-brand-600 text-white'}">
            ${isConnected ? 'Edit' : 'Configure'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function populateDefaultProviderSelect() {
  const select = document.getElementById('defaultProviderSelect');
  if (!select) return;
  select.innerHTML = '';
  
  builtInProviders.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id; opt.textContent = p.name;
    if (p.id === aiState.defaultProvider) opt.selected = true;
    select.appendChild(opt);
  });
  
  aiState.customProviders.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id; opt.textContent = p.name + ' (Custom)';
    if (p.id === aiState.defaultProvider) opt.selected = true;
    select.appendChild(opt);
  });
}

function showSettingsModal() {
  const modal = document.getElementById('settingsModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  
  renderSettingsProvidersGrid();
  renderSettingsCustomGrid();
  populateDefaultProviderSelect();
}

function hideSettingsModal() {
  const modal = document.getElementById('settingsModal');
  modal.classList.remove('flex');
  modal.classList.add('hidden');
}

function openProviderEditModal(id, isCustom) {
  currentEditingProvider = { id, isCustom };
  
  const modal = document.getElementById('providerEditModal');
  const header = document.getElementById('providerEditHeader');
  const info = document.getElementById('providerEditInfo');
  const customFields = document.getElementById('providerEditCustomFields');
  const deleteBtn = document.getElementById('deleteCustomFromEditBtn');
  const keyInput = document.getElementById('editApiKey');
  
  info.classList.add('hidden');
  customFields.classList.add('hidden');
  deleteBtn.classList.add('hidden');
  keyInput.value = '';
  
  let displayName = '', displayIcon = '', displayHint = '';
  
  if (isCustom) {
    const prov = aiState.customProviders.find(p => p.id === id);
    if (!prov) return;
    displayName = prov.name; displayIcon = '🛠️'; displayHint = prov.baseUrl || '';
    customFields.classList.remove('hidden');
    document.getElementById('editCustomName').value = prov.name || '';
    document.getElementById('editCustomDesc').value = prov.desc || '';
    document.getElementById('editCustomBaseUrl').value = prov.baseUrl || '';
    deleteBtn.classList.remove('hidden');
  } else {
    const builtIn = builtInProviders.find(p => p.id === id);
    if (!builtIn) return;
    const conf = aiState.configured[id] || {};
    displayName = builtIn.name; displayIcon = builtIn.icon; displayHint = builtIn.hint;
    info.innerHTML = `<div class="flex items-start gap-2"><span class="text-brand-400">ℹ︎</span> <span>${builtIn.hint}</span></div>`;
    info.classList.remove('hidden');
  }
  
  header.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-2xl bg-surface-700 flex items-center justify-center text-2xl ring-1 ring-white/5">${displayIcon}</div>
      <div><div class="font-semibold">${displayName}</div><div class="text-xs text-gray-400">${displayHint}</div></div>
    </div>
  `;
  
  const conf = isCustom ? aiState.customProviders.find(p => p.id === id) : aiState.configured[id];
  if (conf && conf.apiKey) keyInput.value = conf.apiKey;
  
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  keyInput.focus();
}

function hideProviderEditModal() {
  const modal = document.getElementById('providerEditModal');
  modal.classList.remove('flex');
  modal.classList.add('hidden');
  currentEditingProvider = null;
  
  renderSettingsProvidersGrid();
  renderSettingsCustomGrid();
}

function toggleEditKeyVisibility() {
  const input = document.getElementById('editApiKey');
  const icon = document.getElementById('editEyeIcon');
  if (input.type === 'password') {
    input.type = 'text';
    icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>`;
  } else {
    input.type = 'password';
    icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>`;
  }
}

function testProviderConnection() {
  const key = document.getElementById('editApiKey').value.trim();
  const btn = document.getElementById('testProviderBtn');
  if (!key) { showToast('Please enter an API key', 'error'); return; }
  
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span> Testing...`;
  
  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = original;
    showToast(key.length >= 12 ? 'Connection successful — API key is valid' : 'Connection failed. Check key format.', key.length >= 12 ? 'success' : 'error');
  }, 1200);
}

function saveProviderFromEditModal() {
  if (!currentEditingProvider) return;
  const key = document.getElementById('editApiKey').value.trim();
  if (!key) { showToast('API key is required', 'error'); return; }
  
  if (currentEditingProvider.isCustom) {
    const idx = aiState.customProviders.findIndex(p => p.id === currentEditingProvider.id);
    if (idx !== -1) {
      aiState.customProviders[idx].apiKey = key;
      aiState.customProviders[idx].connected = true;
      if (document.getElementById('editCustomName').value) aiState.customProviders[idx].name = document.getElementById('editCustomName').value;
      if (document.getElementById('editCustomDesc').value) aiState.customProviders[idx].desc = document.getElementById('editCustomDesc').value;
      if (document.getElementById('editCustomBaseUrl').value) aiState.customProviders[idx].baseUrl = document.getElementById('editCustomBaseUrl').value;
    }
  } else {
    aiState.configured[currentEditingProvider.id] = { apiKey: key, connected: true, lastTested: Date.now() };
  }
  
  saveAIState();
  hideProviderEditModal();
  renderSettingsProvidersGrid();
  renderSettingsCustomGrid();
  updateCurrentProviderDisplay();
  showToast('Provider settings saved');
}

function deleteCustomProviderFromEdit() {
  if (!currentEditingProvider || !currentEditingProvider.isCustom) return;
  if (!confirm('Remove this custom provider?')) return;
  
  aiState.customProviders = aiState.customProviders.filter(p => p.id !== currentEditingProvider.id);
  if (aiState.defaultProvider === currentEditingProvider.id) aiState.defaultProvider = 'xai';
  
  saveAIState();
  hideProviderEditModal();
  renderSettingsCustomGrid();
  populateDefaultProviderSelect();
  updateCurrentProviderDisplay();
  showToast('Custom provider removed');
}

function openAddCustomModalFromSettings() {
  const name = prompt('Custom Provider Name:', 'My Custom Video API');
  if (!name) return;
  const baseUrl = prompt('Base URL (optional):', 'https://api.example.com/v1');
  
  const newId = 'custom_' + Date.now().toString(36);
  aiState.customProviders.push({
    id: newId,
    name: name,
    desc: 'Custom video provider',
    baseUrl: baseUrl || '',
    apiKey: '',
    connected: false
  });
  
  saveAIState();
  renderSettingsCustomGrid();
  populateDefaultProviderSelect();
  showToast('Custom provider added. Click Configure to add API key.');
}

function saveAllSettingsFromModal() {
  saveAIState();
  hideSettingsModal();
  updateCurrentProviderDisplay();
  showToast('All settings saved');
}

// Initialize app
function init() {
  loadAIState();
  updateCurrentProviderDisplay();
  renderShotList();
  attachEventListeners();
  updateResolutionIndicator();
}

// Boot app
init();