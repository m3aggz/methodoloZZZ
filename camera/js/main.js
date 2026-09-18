(function () {
  'use strict';

  var appFrame = document.querySelector('.app-frame');
  var video = document.getElementById('camera-video');
  var shutterBtn = document.getElementById('shutter-btn');
  var backHomeBtn = document.getElementById('back-home-btn');

  // ===== 영상 목록 =====
  // 영상이 늘어나면 이 배열에 파일명만 추가하면 됨 (./videos/ 폴더 기준)
  var videoList = [
    './videos/video01.mp4'
  ];

  function pickRandomVideo() {
    var index = Math.floor(Math.random() * videoList.length);
    return videoList[index];
  }

  video.src = pickRandomVideo();

  // ===== 셔터 버튼: 재생 <-> 정지 토글 =====
  shutterBtn.addEventListener('click', function () {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  });

  // ===== 홈으로 =====
  backHomeBtn.addEventListener('click', function () {
    window.location.href = '../home/index.html';
  });

  // ===== 화면 스케일링 =====
function resizeAppFrame() {
  var scaleX = window.innerWidth / 390;
  var scaleY = window.innerHeight / 844;
  var scale = Math.min(scaleX, scaleY);
  appFrame.style.transform = 'scale(' + scale + ')';
}
  window.addEventListener('resize', resizeAppFrame);
  window.addEventListener('load', resizeAppFrame);
  resizeAppFrame();
})();