var gloAppVersion = $('#app_version_scr').data('version');

if (localStorage.getItem('gloAppVersion') == null){
    localStorage.setItem('gloAppVersion',gloAppVersion);
} else if (localStorage.getItem('gloAppVersion') != gloAppVersion){
    localStorage.removeItem('gloAppVersion');

    alert('Session Timeout! Please login again !');
    window.location.href = '/logout';
}