const API_BASE = ['http:', 'https:'].includes(window.location.protocol)
  ? window.location.origin
  : 'http://127.0.0.1:3000';

const storageUsedEl = document.getElementById('storageUsed');
const freeStorageEl = document.getElementById('freeStorage');
const fileCountEl = document.getElementById('fileCount');
const fileMetaEl = document.getElementById('fileMeta');
const serverStatusEl = document.getElementById('serverStatus');
const serverDetailEl = document.getElementById('serverDetail');
const serverBadgeEl = document.getElementById('serverBadge');
const cpuUsageEl = document.getElementById('cpuUsage');
const ramUsageEl = document.getElementById('ramUsage');
const ramDetailEl = document.getElementById('ramDetail');
const systemUptimeEl = document.getElementById('systemUptime');
const systemHostnameEl = document.getElementById('systemHostname');
const systemPlatformEl = document.getElementById('systemPlatform');
const storageBarEl = document.getElementById('storageBar');
const storageMetaEl = document.getElementById('storageMeta');
const filesListEl = document.getElementById('filesList');
const uploadMessageEl = document.getElementById('uploadMessage');
const toastHostEl = document.getElementById('toastHost');
const selectedFilesListEl = document.getElementById('selectedFilesList');
const uploadProgressBarEl = document.getElementById('uploadProgressBar');
const uploadProgressLabelEl = document.getElementById('uploadProgressLabel');
const uploadProgressValueEl = document.getElementById('uploadProgressValue');
const selectedFileEl = document.getElementById('selectedFile');
const previewModalEl = document.getElementById('previewModal');
const previewContentEl = document.getElementById('previewContent');
const previewTitleEl = document.getElementById('previewTitle');
const closePreviewBtnEl = document.getElementById('closePreviewBtn');
const fileInputEl = document.getElementById('fileInput');
const uploadBtnEl = document.getElementById('uploadBtn');
const chooseFileBtnEl = document.getElementById('chooseFileBtn');
const sidebarUploadBtnEl = document.getElementById('sidebarUploadBtn');
const refreshBtnEl = document.getElementById('refreshBtn');
const dropzoneEl = document.getElementById('dropzone');

let selectedFiles = [];
let filesLoading = false;

const formatDate = (value) => new Date(value).toLocaleString();

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const formatSize = (bytes) => {
  if (!bytes) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / (1024 ** index);
  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const formatStorage = (storage) => `${storage.value.toLocaleString()} ${storage.unit}`;

const formatStorageValue = (storage) => storage.value.toLocaleString();

const getFileExtension = (fileName) => {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match ? `.${match[1]}` : '';
};

const isPreviewableFile = (fileName) => {
  const extension = getFileExtension(fileName);
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.mp4', '.webm', '.ogg', '.pdf'].includes(extension);
};

const getPreviewType = (fileName) => {
  const extension = getFileExtension(fileName);

  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(extension)) {
    return 'image';
  }

  if (['.mp4', '.webm', '.ogg'].includes(extension)) {
    return 'video';
  }

  if (extension === '.pdf') {
    return 'pdf';
  }

  return 'unknown';
};

const formatUptime = (seconds) => {
  const totalSeconds = Math.floor(seconds);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};

const setMessage = (message, type = '') => {
  uploadMessageEl.textContent = message;
  uploadMessageEl.className = `message ${type}`.trim();
};

const showToast = (title, message, type = 'info') => {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <strong class="toast-title">${escapeHtml(title)}</strong>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  toastHostEl.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3000);
};

const setLoading = (loading, label = 'Loading files...') => {
  filesLoading = loading;
  filesListEl.classList.toggle('files-loading', loading);
  refreshBtnEl.disabled = loading;
  uploadBtnEl.disabled = loading || selectedFiles.length === 0;

  if (loading) {
    filesListEl.innerHTML = `<div class="empty-state"><div class="spinner" aria-label="Loading"></div><span>${escapeHtml(label)}</span></div>`;
  }
};

const updateStorageStats = (storageInfo, fileCount) => {
  const totalBytes = storageInfo.totalStorage.bytes;
  const usedBytes = storageInfo.usedStorage.bytes;
  const usedPercent = totalBytes > 0 ? Math.min((usedBytes / totalBytes) * 100, 100) : 0;

  storageUsedEl.textContent = formatStorageValue(storageInfo.usedStorage);
  freeStorageEl.textContent = formatStorageValue(storageInfo.freeStorage);
  storageBarEl.style.width = `${usedPercent}%`;
  storageMetaEl.textContent = `${usedPercent.toFixed(1)}% used of ${formatStorage(storageInfo.totalStorage)}`;
  fileCountEl.textContent = String(fileCount);
  fileMetaEl.textContent = fileCount ? `${fileCount} files stored in your cloud` : 'No files uploaded yet';
};

const fetchStorageInfo = async () => {
  const response = await fetch(`${API_BASE}/storage`);

  if (!response.ok) {
    throw new Error('Failed to fetch storage information');
  }

  const payload = await response.json();

  if (!payload.success) {
    throw new Error(payload.message || 'Failed to fetch storage information');
  }

  return payload;
};

const fetchSystemInfo = async () => {
  const response = await fetch(`${API_BASE}/system-info`);

  if (!response.ok) {
    throw new Error('Failed to fetch system information');
  }

  const payload = await response.json();

  if (!payload.success) {
    throw new Error(payload.message || 'Failed to fetch system information');
  }

  return payload;
};

const updateSystemInfo = (systemInfo) => {
  cpuUsageEl.textContent = `${systemInfo.cpuUsage.toFixed(1)}%`;
  ramUsageEl.textContent = `${systemInfo.ramUsage.percent.toFixed(1)}%`;
  ramDetailEl.textContent = `${formatSize(systemInfo.ramUsage.used)} used / ${formatSize(systemInfo.ramUsage.total)} total`;
  systemUptimeEl.textContent = formatUptime(systemInfo.uptime);
  systemHostnameEl.textContent = systemInfo.hostname;
  systemPlatformEl.textContent = systemInfo.platform;
};

const setUploadProgress = (percent, label) => {
  uploadProgressBarEl.style.width = `${Math.min(Math.max(percent, 0), 100)}%`;
  uploadProgressValueEl.textContent = `${Math.round(percent)}%`;
  uploadProgressLabelEl.textContent = label;
};

const closePreview = () => {
  previewModalEl.classList.remove('open');
  previewModalEl.setAttribute('aria-hidden', 'true');
  previewContentEl.innerHTML = '';
  previewTitleEl.textContent = 'Preview';
};

const openPreview = (file) => {
  const previewType = getPreviewType(file.name);
  const previewUrl = `${API_BASE}/preview/${encodeURIComponent(file.name)}`;

  previewTitleEl.textContent = file.name;
  previewContentEl.innerHTML = '';

  if (previewType === 'image') {
    previewContentEl.innerHTML = `<img class="preview-image" src="${previewUrl}" alt="${escapeHtml(file.name)}" />`;
  } else if (previewType === 'video') {
    previewContentEl.innerHTML = `
      <video class="preview-video" controls playsinline preload="metadata">
        <source src="${previewUrl}">
        Your browser does not support video playback.
      </video>
    `;
  } else if (previewType === 'pdf') {
    previewContentEl.innerHTML = `<iframe class="preview-frame" src="${previewUrl}" title="${escapeHtml(file.name)}"></iframe>`;
  } else {
    previewContentEl.innerHTML = '<div class="preview-placeholder">This file type cannot be previewed.</div>';
  }

  previewModalEl.classList.add('open');
  previewModalEl.setAttribute('aria-hidden', 'false');
};

const renderSelectedFiles = () => {
  if (!selectedFiles.length) {
    selectedFileEl.textContent = 'No file selected';
    selectedFilesListEl.innerHTML = '';
    uploadProgressBarEl.style.width = '0%';
    uploadProgressValueEl.textContent = '0%';
    uploadProgressLabelEl.textContent = 'Ready to upload';
    uploadBtnEl.disabled = true;
    return;
  }

  const count = selectedFiles.length;
  const totalBytes = selectedFiles.reduce((sum, file) => sum + file.size, 0);
  selectedFileEl.textContent = count === 1
    ? `${selectedFiles[0].name} (${formatSize(selectedFiles[0].size)})`
    : `${count} files selected (${formatSize(totalBytes)} total)`;

  selectedFilesListEl.innerHTML = selectedFiles.map((file) => `
    <span class="file-chip">${escapeHtml(file.name)}</span>
  `).join('');
  uploadBtnEl.disabled = false;
};

const setSelectedFiles = (files) => {
  selectedFiles = Array.from(files || []);
  renderSelectedFiles();
};

const setServerStatus = (online, detail) => {
  serverStatusEl.textContent = online ? 'Online' : 'Offline';
  serverDetailEl.textContent = detail;
  serverBadgeEl.textContent = online ? 'Server Connected' : 'Server Unavailable';
  serverBadgeEl.className = `status-pill ${online ? 'status-online' : 'status-offline'}`;
};

const renderFiles = (fileList) => {
  if (!fileList.length) {
    filesListEl.innerHTML = '<div class="empty-state">No files uploaded yet.</div>';
    return;
  }

  filesListEl.innerHTML = fileList.map((file) => `
    <article class="file-card">
      <div>
        <h4 class="file-title">${escapeHtml(file.name)}</h4>
        <div class="file-meta">
          <span>${escapeHtml(formatSize(file.size))}</span>
          <span>${escapeHtml(formatDate(file.uploadDate))}</span>
        </div>
      </div>
      <div class="file-actions">
        ${isPreviewableFile(file.name) ? `<button class="button button-secondary preview-btn" data-preview-file="${encodeURIComponent(file.name)}" type="button">Preview</button>` : ''}
        <a class="file-link" href="${API_BASE}/download/${encodeURIComponent(file.name)}" target="_blank" rel="noreferrer">Download</a>
        <button class="button delete-btn" data-delete-file="${encodeURIComponent(file.name)}" type="button">Delete</button>
      </div>
    </article>
  `).join('');

  filesListEl.querySelectorAll('[data-preview-file]').forEach((button) => {
    button.addEventListener('click', () => {
      const fileName = decodeURIComponent(button.dataset.previewFile);
      const file = fileList.find((item) => item.name === fileName);

      if (file) {
        openPreview(file);
      }
    });
  });

  filesListEl.querySelectorAll('[data-delete-file]').forEach((button) => {
    button.addEventListener('click', () => deleteFile(decodeURIComponent(button.dataset.deleteFile)));
  });
};

const loadDashboard = async () => {
  try {
    setLoading(true, 'Fetching files from the backend...');
    setServerStatus(true, 'Checking server status...');

    const [rootResponse, filesResponse, storageInfo, systemInfo] = await Promise.all([
      fetch(`${API_BASE}/`),
      fetch(`${API_BASE}/files`),
      fetchStorageInfo(),
      fetchSystemInfo(),
    ]);

    if (!rootResponse.ok || !filesResponse.ok) {
      throw new Error('Server responded with an error');
    }

    const filePayload = await filesResponse.json();
    const fileList = filePayload.files || [];

    setServerStatus(true, 'Server is live and responding to requests.');
    updateStorageStats(storageInfo, fileList.length);
    updateSystemInfo(systemInfo);
    renderFiles(fileList);
    showToast('Files loaded', `${fileList.length} file(s) synchronized from the backend.`, 'success');
  } catch (error) {
    setServerStatus(false, error.message || 'Unable to reach the backend.');
    filesListEl.innerHTML = '<div class="empty-state">Unable to load files right now.</div>';
    showToast('Load failed', error.message || 'Unable to reach the backend.', 'error');
  } finally {
    setLoading(false);
  }
};

const uploadSingleFile = (file, onProgress) => new Promise((resolve, reject) => {
  const formData = new FormData();
  formData.append('file', file);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', `${API_BASE}/upload`);

  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) {
      onProgress(event.loaded, event.total);
    }
  };

  xhr.onload = () => {
    try {
      const payload = JSON.parse(xhr.responseText || '{}');
      if (xhr.status >= 200 && xhr.status < 300 && payload.success) {
        resolve(payload);
        return;
      }

      reject(new Error(payload.message || 'Upload failed'));
    } catch (error) {
      reject(error);
    }
  };

  xhr.onerror = () => reject(new Error('Network error while uploading file'));
  xhr.send(formData);
});

closePreviewBtnEl.addEventListener('click', closePreview);
previewModalEl.querySelector('[data-close-preview]').addEventListener('click', closePreview);

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closePreview();
  }
});

const pickFile = () => fileInputEl.click();

const handleSelectedFile = (file) => {
  setSelectedFiles(file ? [file] : []);
  uploadMessageEl.textContent = '';
  uploadMessageEl.className = 'message';
};

const handleSelectedFiles = (files) => {
  setSelectedFiles(files);
  uploadMessageEl.textContent = '';
  uploadMessageEl.className = 'message';
};

const uploadFile = async () => {
  if (!selectedFiles.length) {
    setMessage('Choose a file before uploading.', 'error');
    showToast('Upload blocked', 'Choose a file before uploading.', 'error');
    return;
  }

  uploadBtnEl.disabled = true;
  refreshBtnEl.disabled = true;
  fileInputEl.disabled = true;
  setMessage(selectedFiles.length === 1 ? 'Uploading file...' : `Uploading ${selectedFiles.length} files...`, '');
  showToast('Upload started', selectedFiles.length === 1 ? `Uploading ${selectedFiles[0].name}...` : `Uploading ${selectedFiles.length} files...`, 'info');

  const totalBytes = selectedFiles.reduce((sum, file) => sum + file.size, 0);
  let uploadedBytes = 0;
  const completedFiles = [];

  try {
    for (const file of selectedFiles) {
      setUploadProgress((uploadedBytes / totalBytes) * 100, `Uploading ${file.name}`);

      const payload = await uploadSingleFile(file, (loaded, total) => {
        setUploadProgress(((uploadedBytes + loaded) / totalBytes) * 100, `Uploading ${file.name}`);
      });

      uploadedBytes += file.size;
      completedFiles.push(payload.file.originalName);
      showToast('Upload complete', `${file.name} uploaded successfully.`, 'success');
    }

    setUploadProgress(100, 'Upload finished');
    setMessage(`Uploaded ${completedFiles.length} file(s) successfully.`, 'success');
    showToast('All uploads complete', `${completedFiles.length} file(s) uploaded successfully.`, 'success');
    fileInputEl.value = '';
    selectedFiles = [];
    renderSelectedFiles();
    await loadDashboard();
  } catch (error) {
    setMessage(error.message || 'Upload failed', 'error');
    showToast('Upload failed', error.message || 'Upload failed', 'error');
  } finally {
    uploadBtnEl.disabled = selectedFiles.length === 0;
    refreshBtnEl.disabled = false;
    fileInputEl.disabled = false;
    if (selectedFiles.length === 0) {
      setUploadProgress(0, 'Ready to upload');
    }
  }
};

const deleteFile = async (fileName) => {
  showToast('Delete started', `Removing ${fileName}...`, 'info');

  try {
    const response = await fetch(`${API_BASE}/delete/${encodeURIComponent(fileName)}`, {
      method: 'DELETE',
    });

    const payload = await response.json();

    if (!response.ok || !payload.success) {
      throw new Error(payload.message || 'Delete failed');
    }

    setMessage(`Deleted ${fileName}`, 'success');
    showToast('File deleted', fileName, 'success');
    await loadDashboard();
  } catch (error) {
    setMessage(error.message || 'Delete failed', 'error');
    showToast('Delete failed', error.message || 'Delete failed', 'error');
  }
};

fileInputEl.addEventListener('change', (event) => {
  handleSelectedFiles(event.target.files);
});

chooseFileBtnEl.addEventListener('click', pickFile);
sidebarUploadBtnEl.addEventListener('click', pickFile);
uploadBtnEl.addEventListener('click', uploadFile);
refreshBtnEl.addEventListener('click', loadDashboard);

dropzoneEl.addEventListener('dragover', (event) => {
  event.preventDefault();
  dropzoneEl.classList.add('dragover');
});

dropzoneEl.addEventListener('dragleave', () => {
  dropzoneEl.classList.remove('dragover');
});

dropzoneEl.addEventListener('drop', (event) => {
  event.preventDefault();
  dropzoneEl.classList.remove('dragover');

  if (event.dataTransfer.files && event.dataTransfer.files.length) {
    handleSelectedFiles(event.dataTransfer.files);
  }
});

loadDashboard();