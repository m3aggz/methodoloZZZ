(function () {
  'use strict';

  var appFrame = document.querySelector('.app-frame');
  var chatBody = document.getElementById('chat-body');
  var inputDock = document.getElementById('input-dock');
  var messageInput = document.getElementById('message-input');
  var sendBtn = document.getElementById('send-btn');
  var avatarToggleBtn = document.getElementById('avatar-toggle-btn');
  var avatarToggleImg = document.getElementById('avatar-toggle-img');
  var infoBtn = document.getElementById('info-btn');
  var helpOverlay = document.getElementById('help-overlay');
  var helpCloseBtn = document.getElementById('help-close-btn');
  var backBtn = document.getElementById('back-btn');

  var currentSender = 'me'; // 'me' = 민준(나, 노란 말풍선/우측) | 'other' = 윤영(상대방, 보라 말풍선/좌측)
  var currentScale = 1;

  // ===== 발신인 토글 =====
  function updateAvatarBtn() {
    avatarToggleImg.src = currentSender === 'me'
      ? './images/m_button.png'
      : './images/y_button.png';
    avatarToggleImg.alt = currentSender === 'me' ? '민준(나)' : '윤영(상대방)';
  }

  avatarToggleBtn.addEventListener('click', function () {
    currentSender = currentSender === 'me' ? 'other' : 'me';
    updateAvatarBtn();
  });

  // ===== 채팅 목록 높이를 독의 실제 높이에 맞춰 동기화 =====
  function syncChatBodyHeight() {
    var dockHeight = inputDock.getBoundingClientRect().height / currentScale;
    chatBody.style.height = (844 - 60 - dockHeight) + 'px';
  }

  // ===== 입력창 자동 높이 조절 (최대 3줄, 이후 내부 스크롤) =====
  function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    var lineHeight = parseFloat(getComputedStyle(messageInput).lineHeight);
    var paddingV = 16; /* 위아래 padding 합 */
    var maxHeight = lineHeight * 3 + paddingV;
    var newHeight = Math.min(messageInput.scrollHeight, maxHeight);
    messageInput.style.height = Math.max(newHeight, 25) + 'px';
    messageInput.style.overflowY = messageInput.scrollHeight > maxHeight ? 'auto' : 'hidden';
    syncChatBodyHeight();
    scrollChatToBottom();
  }
  messageInput.addEventListener('input', autoResizeTextarea);

  // ===== 말풍선 생성 =====
  function createBubbleRow(text, sender) {
    var row = document.createElement('div');
    row.className = 'bubble-row sender-' + sender;

    var bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.tabIndex = 0;
    bubble.textContent = text;

    row.appendChild(bubble);
    return row;
  }

  function scrollChatToBottom() {
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function sendMessage() {
    var text = messageInput.value.trim();
    if (!text) return;

    var row = createBubbleRow(text, currentSender);
    chatBody.appendChild(row);

    messageInput.value = '';
    autoResizeTextarea();
    scrollChatToBottom();
  }

  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // ===== 말풍선 클릭 -> 수정/삭제 버튼 토글, 수정 중엔 완료 버튼 =====
  var activeBubble = null;

  function clearBubbleActions(row) {
    var actions = row.querySelector('.bubble-actions');
    if (actions) actions.remove();
  }

  function closeActiveBubbleActions() {
    if (activeBubble) {
      clearBubbleActions(activeBubble.closest('.bubble-row'));
      activeBubble = null;
    }
  }

  function openBubbleActions(bubble) {
    closeActiveBubbleActions();

    var row = bubble.closest('.bubble-row');
    var actions = document.createElement('div');
    actions.className = 'bubble-actions';

    var editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'action-icon-btn';
    editBtn.innerHTML = '<img src="./images/edit.png" alt="수정" />';

    var deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'action-icon-btn';
    deleteBtn.innerHTML = '<img src="./images/delete.png" alt="삭제" />';

    editBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      startEditBubble(bubble);
    });
    deleteBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      row.remove();
      activeBubble = null;
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    row.appendChild(actions);
    activeBubble = bubble;
  }

  function showDoneAction(bubble) {
    var row = bubble.closest('.bubble-row');
    clearBubbleActions(row);

    var actions = document.createElement('div');
    actions.className = 'bubble-actions';

    var doneBtn = document.createElement('button');
    doneBtn.type = 'button';
    doneBtn.className = 'action-icon-btn';
    doneBtn.innerHTML = '<img src="./images/done.png" alt="완료" />';
    doneBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      bubble.blur();
    });

    actions.appendChild(doneBtn);
    row.appendChild(actions);
  }

  function startEditBubble(bubble) {
    var row = bubble.closest('.bubble-row');
    clearBubbleActions(row);
    activeBubble = null;

    bubble.classList.add('editing');
    bubble.setAttribute('contenteditable', 'true');
    bubble.focus();

    var range = document.createRange();
    range.selectNodeContents(bubble);
    range.collapse(false);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    showDoneAction(bubble);

    function finishEdit() {
      bubble.removeAttribute('contenteditable');
      bubble.classList.remove('editing');
      var text = bubble.textContent.trim();
      if (!text) {
        row.remove();
      } else {
        bubble.textContent = text;
      }
      clearBubbleActions(row);
      bubble.removeEventListener('blur', finishEdit);
    }

    bubble.addEventListener('blur', finishEdit);
    bubble.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        bubble.blur();
      }
    });
  }

  chatBody.addEventListener('click', function (e) {
    var bubble = e.target.closest('.bubble');

    if (bubble && bubble.getAttribute('contenteditable') === 'true') {
      // 수정 중인 말풍선 클릭은 무시 (텍스트 커서 이동은 브라우저 기본 동작에 맡김)
      return;
    }

    if (bubble) {
      // 같은 말풍선을 다시 클릭하면 버튼을 닫고, 다른 말풍선이면 새로 연다
      if (activeBubble === bubble) {
        closeActiveBubbleActions();
      } else {
        openBubbleActions(bubble);
      }
    } else if (!e.target.closest('.bubble-actions')) {
      closeActiveBubbleActions();
    }
  });

  // ===== 도움말 팝업 =====
  infoBtn.addEventListener('click', function () {
    helpOverlay.classList.remove('hidden');
  });
  helpCloseBtn.addEventListener('click', function () {
    helpOverlay.classList.add('hidden');
  });
  helpOverlay.addEventListener('click', function (e) {
    if (e.target === helpOverlay) {
      helpOverlay.classList.add('hidden');
    }
  });

  // ===== 뒤로가기 =====
  backBtn.addEventListener('click', function () {
    window.location.href = '../home/index.html';
  });

  // ===== 화면 스케일링 =====
  function resizeAppFrame() {
    var scaleX = window.innerWidth / 390;
    var scaleY = window.innerHeight / 844;
    currentScale = Math.min(scaleX, scaleY);
    appFrame.style.transform = 'scale(' + currentScale + ')';
  }
  window.addEventListener('resize', resizeAppFrame);
  window.addEventListener('load', resizeAppFrame);
  resizeAppFrame();

  // ===== 모바일 키보드 대응 =====
  // 키보드가 올라오면 visualViewport 높이가 줄어드는 것을 감지해서,
  // 줄어든 만큼(실제 화면 스케일 배율을 반영해서) 입력 독을 위로 밀어올리고
  // 채팅 목록도 그만큼 줄여서 마지막 메시지가 가려지지 않게 함.
  function handleViewportResize() {
    if (!window.visualViewport) return;
    var vv = window.visualViewport;

    // 실제 화면(px) 기준 키보드가 가리는 높이
    var overlap = window.innerHeight - vv.height - vv.offsetTop;
    if (overlap < 0) overlap = 0;

    // app-frame은 currentScale만큼 축소/확대되어 있으므로,
    // 내부 좌표계(390x844) 기준으로 환산해서 이동시켜야 함
    var shift = currentScale > 0 ? overlap / currentScale : 0;

    inputDock.style.transform = shift > 0 ? 'translateY(-' + shift + 'px)' : '';
    var dockHeight = inputDock.getBoundingClientRect().height / currentScale;
    chatBody.style.height = (844 - 60 - dockHeight - shift) + 'px';

    scrollChatToBottom();
  }

  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleViewportResize);
    window.visualViewport.addEventListener('scroll', handleViewportResize);
  }

  messageInput.addEventListener('focus', function () {
    // 키보드가 완전히 올라온 뒤 위치를 다시 계산 (iOS 타이밍 이슈 보정)
    setTimeout(handleViewportResize, 300);
    setTimeout(scrollChatToBottom, 350);
  });
  messageInput.addEventListener('blur', function () {
    setTimeout(handleViewportResize, 100);
  });

  updateAvatarBtn();
  autoResizeTextarea();
})();