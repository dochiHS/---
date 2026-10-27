// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계를 통과하지 않습니다.
export function createStudentView({ api, onChange } = {}) {
  const dashboard = createDashboard(api, onChange);
  const view = {
    renderIdentity({ me, devices, sessions } = {}) {
      const root = document.createElement('section');
      root.className = 'student-identity';

      const modeLabels = {
        connected: '연결됨',
        demo: '예제 자료',
        disconnected: '연결 없음',
        unknown: '확인 불가',
      };
      const deviceStatusLabels = {
        compliant: '보안 기준 충족',
        noncompliant: '보안 기준 미충족',
        unknown: '확인 불가',
      };
      const sessionStatusLabels = {
        active: '활성',
        expired: '만료',
        revoked: '철회됨',
        unknown: '확인 불가',
      };

      function addText(parent, tag, text) {
        const element = document.createElement(tag);
        element.textContent = text;
        parent.append(element);
        return element;
      }

      function addField(parent, label, value) {
        const row = document.createElement('p');
        const name = document.createElement('strong');
        name.textContent = `${label}: `;
        const content = document.createElement('span');
        content.textContent = String(value ?? '확인 불가');
        row.append(name, content);
        parent.append(row);
      }

      function addMode(parent, resource) {
        const mode = modeLabels[resource?.mode] || '확인 불가';
        addText(parent, 'p', `연결 상태: ${mode}`);
      }

      function addResource(title, resource, renderData) {
        const panel = document.createElement('section');
        addText(panel, 'h3', title);

        if (resource?.status === 'loading') {
          addText(panel, 'p', '불러오는 중');
        } else if (resource?.status === 'error') {
          const message = typeof resource.error?.message === 'string' && resource.error.message
            ? resource.error.message
            : '확인 불가';
          addText(panel, 'p', `연결 실패: ${message}`);
        } else if (resource?.status === 'ok') {
          renderData(panel, resource.data);
        } else {
          addText(panel, 'p', '확인 불가');
        }

        addMode(panel, resource);
        root.append(panel);
      }

      function deviceStatus(status) {
        if (status == null || status === '') return '확인 불가';
        const label = deviceStatusLabels[status] || '확인 불가';
        return `${label}(${String(status)})`;
      }

      function sessionStatus(status) {
        if (status == null || status === '') return '확인 불가';
        const label = sessionStatusLabels[status] || '확인 불가';
        return `${label}(${String(status)})`;
      }

      addResource('현재 로그인 정보', me, (panel, data) => {
        addField(panel, '사용자 이름', data?.user?.label);
        addField(panel, '사용자 ID', data?.user?.id);
        addField(panel, '기기 이름', data?.device?.label);
        addField(panel, '기기 ID', data?.device?.id);
        addField(panel, '기기 보안 상태', deviceStatus(data?.device?.status));
        addField(panel, '세션 ID', data?.session?.id);
        addField(panel, '세션 상태', sessionStatus(data?.session?.status));
      });

      addResource('기기 목록', devices, (panel, data) => {
        if (!Array.isArray(data) || data.length === 0) {
          addText(panel, 'p', '표시할 기기가 없습니다.');
          return;
        }
        const list = document.createElement('ul');
        for (const device of data) {
          const item = document.createElement('li');
          item.textContent = `${device.label ?? '확인 불가'} · ID: ${device.id ?? '확인 불가'} · ${deviceStatus(device.status)}`;
          list.append(item);
        }
        panel.append(list);
      });

      addResource('세션 목록', sessions, (panel, data) => {
        if (!Array.isArray(data) || data.length === 0) {
          addText(panel, 'p', '표시할 세션이 없습니다.');
          return;
        }
        const list = document.createElement('ul');
        for (const session of data) {
          const item = document.createElement('li');
          item.textContent = `세션 ID: ${session.id ?? '확인 불가'} · ${sessionStatus(session.status)}`;
          list.append(item);
        }
        panel.append(list);
      });

      return root;
    },
    renderDecision({ status, mode, data, error, appId } = {}) {
      const root = document.createElement('section');
      root.className = 'student-decision';

      function addText(parent, tag, text) {
        const element = document.createElement(tag);
        element.textContent = String(text ?? '확인 불가');
        parent.append(element);
        return element;
      }

      function addField(parent, label, value) {
        const row = document.createElement('p');
        const name = document.createElement('strong');
        name.textContent = `${label}: `;
        const content = document.createElement('span');
        content.textContent = String(value ?? '확인 불가');
        row.append(name, content);
        parent.append(row);
      }

      addText(root, 'h3', '업무 앱 접근 판정');
      if (mode === 'demo') {
        addText(root, 'p', '예제 자료(demo) · 실제 서버 판정이 아닙니다.');
      } else if (mode === 'disconnected') {
        addText(root, 'p', '연결 없음(disconnected)');
      } else if (mode === 'unknown') {
        addText(root, 'p', '연결 상태 확인 불가(unknown)');
      }

      const resultAppId = typeof data?.appId === 'string' && data.appId
        ? data.appId
        : appId;
      if (resultAppId != null && resultAppId !== '') {
        addField(root, '앱 ID', resultAppId);
      }

      if (status === 'idle') {
        addText(root, 'p', '앱을 골라 접속을 요청하세요.');
      } else if (status === 'loading') {
        addText(root, 'p', '판정 확인 중');
      } else if (status === 'error') {
        const message = typeof error?.message === 'string' && error.message
          ? error.message
          : '확인 불가';
        addText(root, 'p', `요청 실패: ${message}`);
        addText(root, 'p', '접근 거부 판정이 아닙니다.');
      } else if (status === 'ok') {
        const decisionLabels = {
          allow: '허용',
          deny: '거부',
          challenge: '추가 확인 필요',
          unknown: '확인 불가',
        };
        const decision = typeof data?.decision === 'string' && Object.hasOwn(decisionLabels, data.decision)
          ? data.decision
          : 'unknown';
        addField(root, '판정', `${decisionLabels[decision]}(${decision})`);
        addField(root, '판정 이유', data?.reason);
        addField(root, '판정 시각', data?.checkedAt);

        if (decision === 'allow') {
          addText(root, 'p', '정책상 접근 허용 판정이며 실제 앱 접속 성공을 보장하지 않습니다.');
        } else if (decision === 'challenge') {
          addText(root, 'p', '이 앱은 추가 인증 또는 확인 절차를 대신 수행하지 않습니다.');
        }
      } else {
        addText(root, 'p', '판정 확인 불가(unknown)');
      }

      return root;
    },
    renderEvents({ status, mode, data, error } = {}) {
      const root = document.createElement('section');
      root.className = 'student-events';

      function addText(parent, tag, text) {
        const element = document.createElement(tag);
        element.textContent = String(text ?? '확인 불가');
        parent.append(element);
        return element;
      }

      function addField(parent, label, value) {
        const row = document.createElement('p');
        const name = document.createElement('strong');
        name.textContent = `${label}: `;
        const content = document.createElement('span');
        content.textContent = String(value ?? '확인 불가');
        row.append(name, content);
        parent.append(row);
      }

      addText(root, 'h3', '내 접속 기록·XDR 경보');

      const modeLabels = {
        connected: '연결됨(connected)',
        demo: '예제 자료(demo) · 실제 연결 아님',
        disconnected: '연결 없음(disconnected)',
        unknown: '확인 불가(unknown)',
      };
      addText(root, 'p', `연결 상태: ${modeLabels[mode] || modeLabels.unknown}`);

      if (status === 'loading') {
        addText(root, 'p', '기록 불러오는 중');
        return root;
      }

      if (status === 'error') {
        const message = typeof error?.message === 'string' && error.message
          ? error.message
          : '오류 메시지가 없습니다.';
        addText(root, 'p', `기록을 불러오지 못했습니다: ${message}`);
        return root;
      }

      if (status !== 'ok' || !Array.isArray(data)) {
        addText(root, 'p', '확인 불가: 기록 상태 또는 응답 형식을 확인할 수 없습니다.');
        return root;
      }

      // 새 renderEvents 호출마다 배열과 선택 상태를 새로 만들어 이전 목록·상세를 남기지 않는다.
      const events = [...data].sort((a, b) => {
        const timeA = Date.parse(a?.at ?? '');
        const timeB = Date.parse(b?.at ?? '');
        if (!Number.isFinite(timeA) || !Number.isFinite(timeB)) return 0;
        return timeB - timeA;
      });
      let selectedEventId = null;

      const kindLabels = { access: '접속 기록', xdr: 'XDR 경보' };
      const accessLabels = { allowed: '허용됨', denied: '거부됨', unknown: '확인 불가' };
      const sessionLabels = { active: '활성', expired: '만료', revoked: '철회됨', unknown: '확인 불가' };
      const deviceLabels = {
        compliant: '보안 기준 충족',
        noncompliant: '보안 기준 미충족',
        unknown: '확인 불가',
      };

      function stateValue(type, value) {
        const labels = { access: accessLabels, session: sessionLabels, device: deviceLabels };
        if (value == null || value === '') return '확인 불가(상태 정보 없음)';
        const label = Object.hasOwn(labels[type], String(value)) ? labels[type][String(value)] : '확인 불가';
        return `${label}(${String(value)})`;
      }

      function makeFilter(labelText, values, describeValue) {
        const label = document.createElement('label');
        label.textContent = labelText;
        const select = document.createElement('select');
        select.setAttribute('aria-label', labelText);
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = '전체';
        select.append(allOption);
        for (const value of values) {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = describeValue(value);
          select.append(option);
        }
        label.append(select);
        return select;
      }

      function uniqueValues(values) {
        return [...new Set(values.filter((value) => typeof value === 'string' && value !== ''))];
      }

      const filters = document.createElement('div');
      filters.className = 'student-event-filters';
      const kindFilter = makeFilter('기록 종류', uniqueValues(events.map((event) => event?.kind)), (value) => kindLabels[value] || value);
      const appFilter = makeFilter('업무 앱', uniqueValues(events.map((event) => event?.appId)), (value) => value);
      const accessFilter = makeFilter('접속 상태', uniqueValues(events.map((event) => event?.state?.access)), (value) => stateValue('access', value));
      filters.append(kindFilter, appFilter, accessFilter);
      root.append(filters);

      const count = addText(root, 'p', '');
      const listHost = document.createElement('div');
      root.append(listHost);
      const detailHost = document.createElement('div');
      root.append(detailHost);

      function renderDetail(event) {
        detailHost.replaceChildren();
        if (!event) return;

        const eventId = String(event.id ?? '확인 불가');
        const detail = document.createElement('section');
        detail.dataset.studentEventDetail = eventId;
        addText(detail, 'h4', `${eventId} 상세`);
        addField(detail, '사건 ID', eventId);
        addField(detail, '앱 ID', typeof event.appId === 'string' && event.appId ? event.appId : '앱을 확인할 수 없음 (appId 없음)');

        addText(detail, 'h5', '근거');
        if (Array.isArray(event.evidence) && event.evidence.length > 0) {
          const evidenceList = document.createElement('ul');
          for (const evidence of event.evidence) {
            const item = document.createElement('li');
            item.textContent = `${String(evidence?.id ?? '확인 불가')} — ${String(evidence?.text ?? '확인 불가')}`;
            evidenceList.append(item);
          }
          detail.append(evidenceList);
        } else {
          addText(detail, 'p', '근거가 없습니다.');
        }

        addText(detail, 'h5', '규칙');
        if (Array.isArray(event.rules) && event.rules.length > 0) {
          const rulesList = document.createElement('ul');
          for (const rule of event.rules) {
            const item = document.createElement('li');
            item.textContent = `${String(rule?.id ?? '확인 불가')} — ${String(rule?.text ?? '확인 불가')}`;
            rulesList.append(item);
          }
          detail.append(rulesList);
        } else {
          addText(detail, 'p', '규칙 정보가 없습니다.');
        }

        addText(detail, 'h5', '상태');
        addField(detail, '접속 상태', stateValue('access', event.state?.access));
        addField(detail, '세션 상태', stateValue('session', event.state?.session));
        addField(detail, '기기 상태', stateValue('device', event.state?.device));

        if (Array.isArray(event.supportedActions) && event.supportedActions.length > 0) {
          addText(detail, 'h5', '미지원 조치');
          addText(detail, 'p', '조치 실행 연결은 준비 중입니다. 아래 비활성 안내는 조치를 요청하지 않습니다.');
          for (const action of event.supportedActions) {
            const button = document.createElement('button');
            button.type = 'button';
            button.disabled = true;
            button.textContent = `${String(action)} 미지원`;
            detail.append(button);
          }
        }

        detailHost.append(detail);
      }

      function renderList() {
        const filtered = events.filter((event) =>
          (kindFilter.value === 'all' || String(event?.kind ?? '') === kindFilter.value)
          && (appFilter.value === 'all' || String(event?.appId ?? '') === appFilter.value)
          && (accessFilter.value === 'all' || String(event?.state?.access ?? '') === accessFilter.value));
        count.textContent = `표시 건수: ${filtered.length} / 전체 ${events.length}`;
        listHost.replaceChildren();

        if (events.length === 0) {
          addText(listHost, 'p', '표시할 기록이 없습니다.');
          selectedEventId = null;
          renderDetail(null);
          return;
        }
        if (filtered.length === 0) {
          addText(listHost, 'p', '조건에 맞는 기록이 없습니다.');
          selectedEventId = null;
          renderDetail(null);
          return;
        }

        const list = document.createElement('ul');
        for (const event of filtered) {
          const item = document.createElement('li');
          const eventId = String(event.id ?? '확인 불가');
          item.dataset.studentEventId = eventId;
          addField(item, '사건 ID', eventId);
          addField(item, '시각', event.at == null ? '확인 불가' : String(event.at));
          const kind = typeof event.kind === 'string' && Object.hasOwn(kindLabels, event.kind)
            ? kindLabels[event.kind]
            : `확인 불가(${String(event.kind ?? 'unknown')})`;
          addField(item, '종류', kind);
          addField(item, '업무 앱', typeof event.appId === 'string' && event.appId ? event.appId : '앱을 확인할 수 없음 (appId 없음)');
          addField(item, '요약', event.summary);
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = `${eventId} 상세`;
          button.addEventListener('click', () => {
            selectedEventId = eventId;
            renderDetail(event);
          });
          item.append(button);
          list.append(item);
        }
        listHost.append(list);

        const selected = filtered.find((event) => String(event.id ?? '확인 불가') === selectedEventId);
        if (selected) renderDetail(selected);
        else {
          selectedEventId = null;
          renderDetail(null);
        }
      }

      for (const filter of [kindFilter, appFilter, accessFilter]) {
        filter.addEventListener('change', renderList);
      }
      renderList();
      return root;
    },
    renderStatus({ devices, sessions, notifications, diagnostics, mode } = {}) {
      const root = document.createElement('section');
      root.className = 'student-status';

      function addText(parent, tag, text) {
        const element = document.createElement(tag);
        element.textContent = String(text ?? '확인 불가');
        parent.append(element);
        return element;
      }

      function addField(parent, label, value) {
        const row = document.createElement('p');
        const name = document.createElement('strong');
        name.textContent = `${label}: `;
        const content = document.createElement('span');
        content.textContent = String(value ?? '확인 불가');
        row.append(name, content);
        parent.append(row);
      }

      const modeLabels = {
        connected: '연결됨(connected)',
        demo: '예제 자료(demo) · 실제 연결 아님',
        disconnected: '연결 없음(disconnected)',
        unknown: '확인 불가(unknown)',
      };
      addText(root, 'h3', '기기·세션 상태 및 알림');
      addText(root, 'p', `연결 상태: ${modeLabels[mode] || modeLabels.unknown}`);

      const deviceStatusLabels = {
        compliant: '보안 기준 충족',
        noncompliant: '보안 기준 미충족',
        unknown: '확인 불가',
      };
      const sessionStatusLabels = {
        active: '활성',
        expired: '만료',
        revoked: '철회됨',
        unknown: '확인 불가',
      };

      function statusValue(value, labels) {
        if (value == null || value === '') return '확인 불가';
        const raw = String(value);
        const label = Object.hasOwn(labels, raw) ? labels[raw] : '확인 불가';
        return `${label}(${raw})`;
      }

      function renderCollection(title, resource, kind) {
        const panel = document.createElement('section');
        addText(panel, 'h4', title);

        if (resource?.status === 'loading') {
          addText(panel, 'p', '불러오는 중');
        } else if (resource?.status === 'error') {
          const message = typeof resource.error?.message === 'string' && resource.error.message
            ? resource.error.message
            : '오류 메시지가 없습니다.';
          const code = typeof resource.error?.code === 'string' ? resource.error.code : '';
          const timedOut = /TIMEOUT|TIMED_OUT/i.test(code) || /시간\s*초과/i.test(message);
          addText(panel, 'p', `${title} 정보를 불러오지 못했습니다${timedOut ? ' (시간 초과)' : ''}: ${message}`);
          addText(panel, 'p', '다시 시도는 위쪽 다시 불러오기 버튼을 직접 누르세요.');
        } else if (resource?.status === 'ok' && Array.isArray(resource.data)) {
          if (resource.data.length === 0) {
            addText(panel, 'p', kind === 'devices' ? '등록된 기기가 없습니다.' : '현재 연결이 없습니다.');
          } else {
            const list = document.createElement('ul');
            for (const item of resource.data) {
              const row = document.createElement('li');
              if (kind === 'devices') {
                row.textContent = `${String(item?.label ?? '확인 불가')} · 상태: ${statusValue(item?.status, deviceStatusLabels)}`;
              } else {
                row.textContent = `세션 ID: ${String(item?.id ?? '확인 불가')} · 상태: ${statusValue(item?.status, sessionStatusLabels)}`;
              }
              list.append(row);
            }
            panel.append(list);
          }
        } else {
          addText(panel, 'p', '확인 불가: 응답 상태 또는 목록 형식을 확인할 수 없습니다.');
        }

        root.append(panel);
      }

      renderCollection('기기', devices, 'devices');
      renderCollection('세션', sessions, 'sessions');
      addText(root, 'p', '세션 목록은 현재 검증된 연결 하나만 나타내며, 지난 세션 전체 목록이 아닙니다.');

      const notificationPanel = document.createElement('section');
      addText(notificationPanel, 'h4', '알림');
      if (!Array.isArray(notifications) || notifications.length === 0) {
        addText(notificationPanel, 'p', '주의할 알림이 없습니다.');
      } else {
        const list = document.createElement('ul');
        for (const notification of notifications) {
          const row = document.createElement('li');
          const resource = String(notification?.resource ?? '확인 불가');
          const code = String(notification?.code ?? '확인 불가');
          const message = String(notification?.message ?? '확인 불가');
          row.textContent = `${resource} · 코드: ${code} · ${message}`;
          list.append(row);
        }
        notificationPanel.append(list);
      }
      root.append(notificationPanel);

      const diagnosticsPanel = document.createElement('section');
      addText(diagnosticsPanel, 'h4', '도움정보');
      let copyButton = null;
      let copyStatus = null;
      if (diagnostics?.status === 'loading') {
        addText(diagnosticsPanel, 'p', '도움정보를 불러오는 중');
      } else if (diagnostics?.status === 'error') {
        const message = typeof diagnostics.error?.message === 'string' && diagnostics.error.message
          ? diagnostics.error.message
          : '오류 메시지가 없습니다.';
        addText(diagnosticsPanel, 'p', `도움정보를 불러오지 못했습니다: ${message}`);
      } else if (diagnostics?.status === 'ok' && diagnostics.data && typeof diagnostics.data === 'object') {
        const data = diagnostics.data;
        const engine = data.engine && typeof data.engine === 'object' ? data.engine : {};
        const safeInfo = {
          requestId: typeof data.requestId === 'string' ? data.requestId : '확인 불가',
          component: typeof data.component === 'string' ? data.component : '확인 불가',
          version: typeof data.version === 'string' ? data.version : '확인 불가',
          checkedAt: typeof data.checkedAt === 'string' ? data.checkedAt : '확인 불가',
          engine: {
            mode: typeof engine.mode === 'string' ? engine.mode : '확인 불가',
            code: typeof engine.code === 'string' ? engine.code : '확인 불가',
          },
        };
        addField(diagnosticsPanel, 'requestId', safeInfo.requestId);
        addField(diagnosticsPanel, 'component', safeInfo.component);
        addField(diagnosticsPanel, 'version', safeInfo.version);
        addField(diagnosticsPanel, 'checkedAt', safeInfo.checkedAt);
        addField(diagnosticsPanel, 'engine.mode', safeInfo.engine.mode);
        addField(diagnosticsPanel, 'engine.code', safeInfo.engine.code);
        addText(diagnosticsPanel, 'p', '도움정보 복사는 위의 안전한 진단 항목을 도움 요청에 전달하기 위한 기능입니다.');
        copyButton = document.createElement('button');
        copyButton.type = 'button';
        copyButton.textContent = '도움정보 복사';
        copyStatus = addText(diagnosticsPanel, 'p', '아직 복사하지 않았습니다.');
        copyStatus.setAttribute('role', 'status');
        copyButton.addEventListener('click', async () => {
          try {
            if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') throw new Error('CLIPBOARD_UNAVAILABLE');
            await navigator.clipboard.writeText(JSON.stringify(safeInfo, null, 2));
            copyStatus.textContent = '안전한 도움정보를 클립보드에 복사했습니다.';
          } catch {
            copyStatus.textContent = '도움정보를 복사하지 못했습니다. 브라우저의 클립보드 권한을 확인하세요.';
          }
        });
        diagnosticsPanel.append(copyButton);
      } else {
        addText(diagnosticsPanel, 'p', '도움정보는 아직 확인되지 않았습니다.');
      }
      root.append(diagnosticsPanel);

      return root;
    },
    renderVulnerabilities({ status, mode, data, error } = {}) {
      const root = document.createElement('section');
      root.className = 'student-vulnerabilities';

      function addText(parent, tag, text) {
        const element = document.createElement(tag);
        element.textContent = String(text ?? '확인 불가');
        parent.append(element);
        return element;
      }

      function addField(parent, label, value) {
        const row = document.createElement('p');
        const name = document.createElement('strong');
        name.textContent = `${label}: `;
        const content = document.createElement('span');
        content.textContent = String(value ?? '확인 불가');
        row.append(name, content);
        parent.append(row);
      }

      addText(root, 'h3', '설치 패키지 취약점 조회');

      if (status === 'idle') {
        addText(root, 'p', '조회 전(idle)');
        return root;
      }
      if (status === 'loading') {
        addText(root, 'p', '조회 중(loading)');
        return root;
      }
      if (status === 'error') {
        const message = typeof error?.message === 'string' && error.message
          ? error.message
          : '오류 메시지를 확인할 수 없습니다.';
        addText(root, 'p', `조회 실패(error): ${message}`);
        addText(root, 'p', '조회 실패는 취약점이 없다는 뜻이 아닙니다. 이전 결과는 현재 조회 결과로 표시하지 않습니다.');
        return root;
      }
      if (status !== 'ok') {
        addText(root, 'p', '조회 상태를 확인할 수 없습니다. 취약점 유무를 판단하지 않습니다.');
        return root;
      }

      const scan = data?.status;
      const scanLabels = {
        complete: '모두 조회',
        partial: '일부 조회 실패',
        not_checked: '아직 조회 안 함',
        not_configured: '조회 준비 미완료',
        unverifiable: '설치 목록 확인 불가',
      };
      const scanLabel = typeof scan === 'string' && Object.hasOwn(scanLabels, scan)
        ? `${scanLabels[scan]}(${scan})`
        : `확인 불가(${String(scan ?? 'unknown')})`;
      addField(root, '전체 조회 상태', scanLabel);

      if (scan === 'partial') {
        addText(root, 'p', '일부 패키지 조회에 실패했지만, 이미 확인된 취약점 항목은 아래에 유지합니다.');
      } else if (scan === 'not_checked') {
        addText(root, 'p', '승인된 공개 조회 대상이 없어 아직 패키지 조회를 하지 않았습니다. 이는 취약점 없음이 아닙니다.');
      } else if (scan === 'not_configured') {
        addText(root, 'p', '프로젝트 조회 설정이 없어 조회하지 않았습니다. 이는 취약점 없음이 아닙니다.');
      } else if (scan === 'unverifiable') {
        addText(root, 'p', '설치 목록을 확인할 수 없어 취약점 조회 결과를 판단할 수 없습니다.');
      }

      if (data?.lockfileVersion != null) addField(root, '잠금 파일 버전', data.lockfileVersion);
      if (data?.lockfileHash != null && data.lockfileHash !== '') addField(root, 'package-lock.json 해시', data.lockfileHash);
      if (data?.checkedAt != null && data.checkedAt !== '') addField(root, '전체 조회 시각', data.checkedAt);

      if (!Array.isArray(data?.packages)) {
        addText(root, 'p', '패키지별 조회 결과를 확인할 수 없습니다.');
        return root;
      }
      if (data.packages.length === 0) {
        addText(root, 'p', '표시할 패키지 조회 결과가 없습니다. 이는 취약점이 없다는 뜻이 아닙니다.');
        return root;
      }

      const packageStatusLabels = {
        known_vulnerabilities: '알려진 취약점 있음',
        none_found: '알려진 취약점 없음',
        unverifiable: '조회 확인 불가',
      };

      for (const pkg of data.packages) {
        const name = String(pkg?.name ?? '확인 불가');
        const version = String(pkg?.version ?? '확인 불가');
        const packagePanel = document.createElement('section');
        packagePanel.setAttribute('data-student-package-name', name);
        packagePanel.setAttribute('data-student-package-version', version);
        addText(packagePanel, 'h4', `${name} · 설치 버전 ${version}`);
        addField(packagePanel, '패키지 이름', name);
        addField(packagePanel, '정확한 설치 버전', version);

        const packageStatus = pkg?.status;
        const statusLabel = typeof packageStatus === 'string' && Object.hasOwn(packageStatusLabels, packageStatus)
          ? `${packageStatusLabels[packageStatus]}(${packageStatus})`
          : `조회 확인 불가(${String(packageStatus ?? 'unknown')})`;
        addField(packagePanel, '패키지 조회 상태', statusLabel);
        if (packageStatus === 'unverifiable' && Array.isArray(pkg?.vulnerabilities) && pkg.vulnerabilities.length > 0) {
          addText(packagePanel, 'p', '일부 확인 · 전체 조회 확인 불가(unverifiable). 이미 받은 취약점 ID는 아래에 표시합니다.');
        } else if (packageStatus === 'none_found') {
          addText(packagePanel, 'p', '조회 범위에서 알려진 항목이 없습니다. 이 결과는 패키지나 앱 전체의 안전을 보장하지 않습니다.');
        } else if (packageStatus === 'unverifiable') {
          addText(packagePanel, 'p', '조회 확인 불가는 취약점 없음이 아닙니다.');
        }

        addField(packagePanel, 'OSV 출처', pkg?.source);
        addField(packagePanel, '패키지 조회 시각', pkg?.checkedAt);

        const findings = Array.isArray(pkg?.vulnerabilities) ? pkg.vulnerabilities : [];
        if (findings.length > 0) {
          addText(packagePanel, 'h5', '취약점 항목');
          const list = document.createElement('ul');
          for (const finding of findings) {
            const item = document.createElement('li');
            item.textContent = `ID: ${String(finding?.id ?? '확인 불가')} · 수정 시각: ${String(finding?.modified ?? '확인 불가')}`;
            list.append(item);
          }
          packagePanel.append(list);
        } else if (packageStatus === 'known_vulnerabilities') {
          addText(packagePanel, 'p', '취약점 항목 세부 자료를 확인할 수 없습니다.');
        }

        root.append(packagePanel);
      }

      return root;
    },
    renderAiConnection({ status, mode, data, error, checkedAt, explanationAccepted } = {}) {
      const root = document.createElement('section');
      root.className = 'student-ai-connection';

      function addText(tag, text) {
        const element = document.createElement(tag);
        element.textContent = String(text ?? '확인 불가');
        root.append(element);
        return element;
      }

      function addField(label, value) {
        const row = document.createElement('p');
        const name = document.createElement('strong');
        name.textContent = `${label}: `;
        const content = document.createElement('span');
        content.textContent = String(value ?? '확인 불가');
        row.append(name, content);
        root.append(row);
      }

      function safeErrorCode(value) {
        return typeof value === 'string' && /^[A-Z0-9_]{1,80}$/.test(value) ? value : 'UNKNOWN_ERROR';
      }

      function safeErrorMessage(value) {
        if (typeof value !== 'string' || value.trim() === '' || value.length > 500
          || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) {
          return '안전한 오류 메시지를 확인할 수 없습니다.';
        }
        if (/(?:Bearer\s+\S+|sk-(?:on-|proj-|ant-|svcacct-)?[A-Za-z0-9_-]{8,}|(?:api[_ -]?key|authorization|password|비밀번호|토큰)\s*[:=]\s*\S+)/i.test(value)) {
          return '민감한 내용이 포함되어 있어 오류 메시지를 표시하지 않습니다.';
        }
        return value.trim();
      }

      const errorGuidance = {
        ON_AI_PROVISIONING_PENDING: '권한 준비 중 또는 확인 불가입니다. 담당자에게 계정 연결과 앱 권한을 확인해 달라고 요청하세요.',
        ON_AI_TRANSPORT_PENDING: 'AI 연결 구성요소를 확인할 수 없습니다. 담당자에게 앱 연결 준비 상태를 확인해 달라고 요청하세요.',
        ON_AI_AUTHORIZATION_CHANGED: '점검 중 앱 권한이 변경되었습니다. 담당자에게 현재 권한을 확인해 달라고 요청하세요.',
        WB_CLCO_AUTH_REQUIRED: '인증에 실패했습니다. 계정 연결과 앱 승인을 다시 확인하고, 계속되면 담당자에게 확인을 요청하세요.',
        WB_CLCO_ACCESS_BLOCKED: '접근이 제한되었습니다. 담당자에게 계정의 앱 이용 권한을 확인해 달라고 요청하세요.',
        WB_CLCO_COHORT_BUDGET_EXHAUSTED: '반 사용량 한도에 도달했습니다. 담당자에게 사용량을 확인해 달라고 요청하세요.',
        WB_CLCO_LIMIT_REACHED: 'AI 이용 한도에 도달했습니다. 담당자에게 한도를 확인해 달라고 요청하세요.',
        WB_CLCO_SESSION_CLOSED: '현재 이용 시간이 아닙니다. 허용된 이용 시간을 확인하세요.',
        WB_CLCO_RATE_LIMITED: '요청이 제한되었습니다. 잠시 뒤 현재 API 연결 점검을 직접 다시 실행하세요.',
        WB_CLCO_TIMEOUT: '요청 시간이 초과되었습니다. 잠시 뒤 현재 API 연결 점검을 직접 다시 실행하세요.',
        WB_CLCO_NETWORK_ERROR: '네트워크 연결을 확인할 수 없습니다. 잠시 뒤 현재 API 연결 점검을 직접 다시 실행하세요.',
        WB_CLCO_SERVER_UNAVAILABLE: 'AI 서비스에 연결할 수 없습니다. 잠시 뒤 현재 API 연결 점검을 직접 다시 실행하세요.',
        WB_CLCO_CANCELLED: '점검이 취소되었습니다. 이전 점검 결과는 현재 결과가 아닙니다.',
        ON_AI_MODEL_LIST_EMPTY: '사용할 수 있는 모델이 없습니다. 담당자에게 모델 허용 설정을 확인해 달라고 요청하세요.',
        MODEL_NOT_CONFIGURED: '사용하도록 설정된 모델을 확인할 수 없습니다. 담당자에게 모델 허용 설정을 확인해 달라고 요청하세요.',
        WB_CLCO_INVALID_RESPONSE: 'AI 서비스 응답을 확인할 수 없습니다. 담당자에게 연결 구성을 확인해 달라고 요청하세요.',
      };

      addText('h3', '앱 내부 AI 연결 점검');

      if (status === 'idle') {
        addText('p', 'AI 연결 점검 전');
        addText('p', '이전 점검 결과는 현재 결과가 아닙니다.');
      } else if (status === 'loading') {
        addText('p', 'AI 연결 점검 중');
      } else if (status === 'ok') {
        const authorization = data?.audienceAuthorization;
        const authorizationLabels = {
          test: '시험 연결 점검(test)',
          verified: '앱 권한 확인 후 점검(verified)',
        };
        if (data?.transportChecked !== true || !Object.hasOwn(authorizationLabels, authorization)) {
          addText('p', 'AI 연결 점검 결과를 확인할 수 없습니다. 계약에 맞는 결과가 아닙니다.');
        } else {
          addText('p', authorizationLabels[authorization]);
          addField('모델 수', Number.isSafeInteger(data.modelCount) && data.modelCount >= 0 ? data.modelCount : '확인 불가');
          addField('점검 시각', typeof checkedAt === 'string' && checkedAt ? checkedAt : '확인 불가');
          addText('p', '앱 서버 경유 전송 경로를 점검했습니다. 모델 목록 응답은 사건 설명 실행이 아닙니다.');
          addText('p', '사건 설명은 아직 실행하지 않았습니다.');
        }
      } else if (status === 'error') {
        const code = safeErrorCode(error?.code);
        addField('오류 코드', code);
        addField('오류 메시지', safeErrorMessage(error?.message));
        addText('p', Object.hasOwn(errorGuidance, code)
          ? errorGuidance[code]
          : '오류 원인을 확인할 수 없습니다. 담당자에게 계정 연결과 앱 권한을 확인해 달라고 요청하세요.');
        if (code === 'WB_CLCO_CANCELLED') {
          addText('p', '취소된 점검은 연결 성공이나 현재 권한 확인을 뜻하지 않습니다.');
        }
      } else {
        addText('p', 'AI 연결 점검 상태를 확인할 수 없습니다.');
      }

      addText('p', '다시 점검하려면 사용자가 「현재 API 연결 점검」 버튼을 직접 누르세요. 자동 재점검은 하지 않습니다.');
      return root;
    },
    renderExplanation({ event, explanation, checkedAt } = {}) {
      const root = document.createElement('section');
      root.className = 'student-ai-explanation';

      function addText(tag, text) {
        const element = document.createElement(tag);
        element.textContent = String(text ?? '확인 불가');
        root.append(element);
        return element;
      }

      function safeErrorCode(value) {
        return typeof value === 'string' && /^[A-Z0-9_]{1,80}$/.test(value) ? value : 'UNKNOWN_ERROR';
      }

      function safeErrorMessage(value) {
        if (typeof value !== 'string' || value.trim() === '' || value.length > 500
          || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) {
          return '안전한 오류 메시지를 확인할 수 없습니다.';
        }
        if (/(?:Bearer\s+\S+|sk-(?:on-|proj-|ant-|svcacct-)?[A-Za-z0-9_-]{8,}|(?:api[_ -]?key|authorization|password|비밀번호|토큰)\s*[:=]\s*\S+)/i.test(value)) {
          return '민감한 내용이 포함되어 있어 오류 메시지를 표시하지 않습니다.';
        }
        return value.trim();
      }

      function addFailure(message, code) {
        addText('p', message);
        if (typeof code === 'string' && /^[A-Z0-9_]{1,80}$/.test(code)) addText('p', `오류 코드: ${code}`);
      }

      addText('h3', '보안 사건 AI 설명');

      // 오류를 먼저 처리한다. 요청이 실패해도 선택 이벤트가 없다는 이유로 실패 정보를 숨기지 않는다.
      if (explanation?.status === 'error') {
        const code = safeErrorCode(explanation.error?.code);
        addText('p', `AI 설명 실패 (${code}): ${safeErrorMessage(explanation.error?.message)}`);
        const reason = code === 'ON_AI_INVALID_INPUT'
          ? '실패 이유: 설명에 필요한 근거가 부족하거나 입력 근거를 확인할 수 없습니다.'
          : code === 'ON_AI_INVALID_OUTPUT'
            ? '실패 이유: AI 설명의 근거·제안·응답 형식이 계약과 일치하지 않습니다.'
            : code === 'SUBJECT_SCOPE_UNVERIFIED'
              ? '실패 이유: 설명 대상 기록과 현재 계정의 연결을 확인할 수 없습니다.'
              : '실패 이유는 오류 코드와 메시지를 확인하세요.';
        addText('p', reason);
        if (explanation.data?.executed === true) {
          addText('p', 'AI가 이미 실행했다고 답한 설명은 사용할 수 없습니다. 해당 응답은 표시하지 않습니다.');
        }
        addText('p', '기록은 그대로입니다. 이 오류는 기록이나 접근 판정이 아닙니다.');
        return root;
      }

      if (!event) {
        addText('p', '보안 기록에서 기록을 먼저 고르세요.');
        return root;
      }

      if (explanation?.status === 'loading') {
        addText('p', 'AI 설명 요청 중');
        return root;
      }
      if (explanation?.status === 'idle') {
        addText('p', 'AI 설명 요청 전');
        return root;
      }
      if (explanation?.status !== 'ok') {
        addText('p', 'AI 설명 상태를 확인할 수 없습니다.');
        return root;
      }

      const eventId = typeof event.id === 'string' && event.id !== '' ? event.id : null;
      const explanationData = explanation.data;
      const evidence = Array.isArray(event.evidence) ? event.evidence : [];
      const evidenceById = new Map();
      for (const item of evidence) {
        if (item && typeof item.id === 'string' && !evidenceById.has(item.id)) evidenceById.set(item.id, item);
      }
      const evidenceIds = explanationData?.evidenceIds;
      const uniqueEvidenceIds = Array.isArray(evidenceIds)
        && evidenceIds.every((id) => typeof id === 'string')
        && new Set(evidenceIds).size === evidenceIds.length;
      const allEventEvidenceCited = uniqueEvidenceIds
        && evidence.length > 0
        && evidenceById.size === evidence.length
        && evidenceIds.length === evidenceById.size
        && evidenceIds.every((id) => evidenceById.has(id));
      const proposals = explanationData?.proposals;
      const proposalsValid = Array.isArray(proposals) && proposals.every((proposal) => {
        if (!proposal || typeof proposal.action !== 'string' || typeof proposal.reason !== 'string'
          || !Array.isArray(proposal.evidenceIds) || proposal.evidenceIds.length === 0
          || new Set(proposal.evidenceIds).size !== proposal.evidenceIds.length
          || !proposal.evidenceIds.every((id) => typeof id === 'string' && evidenceById.has(id))) return false;
        return Array.isArray(event.supportedActions) && event.supportedActions.includes(proposal.action);
      });

      if (!eventId) {
        addFailure('사건 ID를 확인할 수 없어 설명을 표시하지 않습니다.', explanation.error?.code);
        return root;
      }
      if (explanationData?.executed === true) {
        addFailure('AI가 이미 실행했다고 답한 설명은 사용할 수 없습니다. 해당 응답은 표시하지 않습니다.', explanation.error?.code);
        return root;
      }
      if (!explanationData || typeof explanationData.summary !== 'string' || explanationData.summary.trim() === '') {
        addFailure('AI 설명 자료가 없어 요약을 표시할 수 없습니다.', explanation.error?.code);
        return root;
      }
      if (!allEventEvidenceCited) {
        addFailure('근거가 현재 선택한 기록과 일치하지 않아 AI 설명을 표시할 수 없습니다. 근거 ID를 확인할 수 없습니다.', explanation.error?.code);
        return root;
      }
      if (explanationData.requiresHumanConfirmation !== true || explanationData.executed !== false || !proposalsValid) {
        addFailure('제안의 근거·지원 여부 또는 실행 상태를 확인할 수 없어 AI 설명을 표시할 수 없습니다.', explanation.error?.code);
        return root;
      }

      // 성공 표식은 event 및 모든 인용 근거·제안의 연결을 확인한 뒤에만 설정한다.
      root.setAttribute('data-student-explanation-event', eventId);
      addText('p', `사건 ID: ${eventId}`);
      addText('h4', 'AI 설명(참고용)');
      addText('p', explanationData.summary);

      addText('h4', '인용한 근거');
      const citedEvidence = document.createElement('ul');
      for (const id of evidenceIds) {
        const item = evidenceById.get(id);
        const row = document.createElement('li');
        row.textContent = `${id} — ${String(item.text ?? '근거 글을 확인할 수 없습니다.')}`;
        citedEvidence.append(row);
      }
      root.append(citedEvidence);

      addText('h4', '규칙');
      if (Array.isArray(event.rules) && event.rules.length > 0) {
        const rules = document.createElement('ul');
        for (const rule of event.rules) {
          const row = document.createElement('li');
          row.textContent = `${String(rule?.id ?? '확인 불가')} — ${String(rule?.text ?? '확인 불가')}`;
          rules.append(row);
        }
        root.append(rules);
      } else {
        addText('p', '규칙 정보가 없습니다.');
      }

      addText('h4', '확인 불가 상태');
      const unknownStates = [];
      for (const [key, label] of [['access', '접속'], ['session', '세션'], ['device', '기기']]) {
        if (event.state?.[key] === 'unknown') unknownStates.push(`${label}: 확인 불가(unknown)`);
      }
      addText('p', unknownStates.length > 0 ? unknownStates.join(' · ') : '없음');

      addText('h4', '제안');
      if (proposals.length === 0) {
        if (Array.isArray(event.supportedActions) && event.supportedActions.length === 0) {
          addText('p', '연동 시스템이 지원하는 조치가 없어 제안이 없습니다(정상).');
        } else {
          addText('p', 'AI가 제안한 조치가 없습니다.');
        }
      } else {
        const proposalList = document.createElement('ul');
        for (const proposal of proposals) {
          const row = document.createElement('li');
          row.textContent = `${proposal.action} — 이유: ${proposal.reason} · 사람이 확인해야 실행할 수 있으며 아직 실행되지 않았습니다.`;
          proposalList.append(row);
          const refs = document.createElement('ul');
          for (const id of proposal.evidenceIds) {
            const refRow = document.createElement('li');
            refRow.textContent = `${id} — ${String(evidenceById.get(id).text ?? '근거 글을 확인할 수 없습니다.')}`;
            refs.append(refRow);
          }
          row.append(refs);
        }
        root.append(proposalList);
        addText('p', '모든 제안은 참고 정보입니다. 실행에는 사람의 확인이 필요하며, 이 화면은 조치를 실행하지 않습니다.');
      }

      return root;
    },
    renderAction({ status, event, actionId, target, receipt, observation, message, confirmationExpiresAt, error } = {}) {
      const root = document.createElement('section');
      root.className = 'student-action';

      function addText(parent, tag, text) {
        const element = document.createElement(tag);
        element.textContent = String(text ?? '확인 불가');
        parent.append(element);
        return element;
      }

      function addField(parent, label, value) {
        const row = document.createElement('p');
        const name = document.createElement('strong');
        name.textContent = `${label}: `;
        const content = document.createElement('span');
        content.textContent = String(value ?? '확인 불가');
        row.append(name, content);
        parent.append(row);
      }

      function safeCode(value) {
        return typeof value === 'string' && /^[A-Z0-9_]{1,80}$/.test(value)
          ? value
          : 'UNKNOWN_ERROR';
      }

      function safeMessage(value) {
        if (typeof value !== 'string' || value.trim() === '' || value.length > 500
          || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) {
          return '안전한 메시지를 확인할 수 없습니다.';
        }
        if (/(?:Bearer\s+\S+|sk-(?:proj-|ant-|svcacct-)?[A-Za-z0-9_-]{8,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:api[_ -]?key|authorization|password|비밀번호|토큰)\s*[:=]\s*\S+)/i.test(value)) {
          return '민감한 내용이 포함되어 있어 메시지를 표시하지 않습니다.';
        }
        return value.trim();
      }

      const statusLabels = {
        idle: '아직 미실행(idle)',
        loading: '조치 준비 또는 결과 조회 중(loading)',
        prepared: '준비됨·미실행(prepared)',
        executing: '서버에 전달 중(executing)',
        pending: '서버 접수·처리 중(pending)',
        succeeded: '효과 확인(succeeded)',
        denied: '거절(denied)',
        failed: '실패(failed)',
        unknown: '결과 불명(unknown)',
        error: '요청 처리 안 됨(error)',
        expired: '확인 기한 지남(expired)',
      };

      addText(root, 'h3', '보안 조치 요청 상태와 결과');

      const knownStatus = typeof status === 'string' && Object.hasOwn(statusLabels, status);
      const effectiveStatus = knownStatus ? status : 'unknown';
      const effectConfirmed = effectiveStatus === 'succeeded' && observation?.effectApplied === true;
      const statusText = effectiveStatus === 'succeeded' && !effectConfirmed
        ? '결과 불명(unknown)'
        : statusLabels[effectiveStatus];
      addText(root, 'p', statusText);
      if (!knownStatus && status != null) {
        addText(root, 'p', `확인할 수 없는 상태 코드: ${String(status)}`);
      }

      if (event?.id != null && event.id !== '') addField(root, '사건 ID', event.id);
      if (Array.isArray(event?.evidence)) {
        const evidenceIds = event.evidence
          .map((evidence) => evidence?.id)
          .filter((id) => id != null && id !== '')
          .map(String);
        if (evidenceIds.length > 0) addField(root, '근거 ID', evidenceIds.join(', '));
      }
      if (actionId != null && actionId !== '') addField(root, '조치 ID', actionId);
      if (target?.id != null && target.id !== '') addField(root, '실제 대상 ID', target.id);
      if (target?.generation != null) addField(root, '대상 generation', target.generation);
      if (receipt?.requestId != null && receipt.requestId !== '') addField(root, '요청 ID', receipt.requestId);
      if (receipt?.receiptId != null && receipt.receiptId !== '') addField(root, '접수 ID', receipt.receiptId);
      if (receipt?.version != null) addField(root, '결과 version', receipt.version);
      if (receipt?.status != null && receipt.status !== '') addField(root, '서버 접수 상태', receipt.status);

      if (effectiveStatus === 'idle') {
        addText(root, 'p', '조치 제안은 아직 실행되지 않았습니다. 조치 준비가 필요한 경우 제공 화면의 기능을 사용하세요.');
      } else if (effectiveStatus === 'loading') {
        addText(root, 'p', '조치 준비 또는 연동 시스템 결과 조회를 처리 중입니다. 아직 실행 결과나 효과 관측이 확인되지 않았습니다.');
      } else if (effectiveStatus === 'prepared') {
        addText(root, 'p', '조치가 준비되었지만 아직 실행되지 않았습니다. 제공 화면에서 실제 대상과 조치를 확인한 뒤 사람 확인 절차를 진행하세요.');
        addField(root, '확인 기한', confirmationExpiresAt);
      } else if (effectiveStatus === 'executing') {
        addText(root, 'p', '서버에 전달 중(executing)입니다. 결과가 아직 확인되지 않았으며 완료 또는 성공을 뜻하지 않습니다.');
      } else if (effectiveStatus === 'pending') {
        addText(root, 'p', '서버 접수·처리 중(pending)입니다. 접수 응답(ACK)은 효과가 확인되었다는 뜻이 아니며, 결과가 아직 확인되지 않았습니다.');
        addText(root, 'p', '결과는 제공 화면에서 연동 시스템 결과만 재조회해 확인하세요.');
      } else if (effectiveStatus === 'succeeded') {
        if (effectConfirmed) {
          addText(root, 'p', '연동 시스템의 관측으로 조치 효과를 확인했습니다.');
          addField(root, '관측 시각', observation.observedAt);
          addField(root, 'effectApplied', 'true');
          addField(root, '접수 ID', receipt?.receiptId);
          if (event?.id != null && event.id !== '') {
            root.setAttribute('data-student-action-event', String(event.id));
          }
          if (receipt?.requestId != null && receipt.requestId !== '') {
            root.setAttribute('data-student-action-request', String(receipt.requestId));
          }
        } else {
          addText(root, 'p', '효과 관측이 확인되지 않아 결과를 성공 또는 효과 없음으로 판단할 수 없습니다.');
          addText(root, 'p', '제공 화면에서 연동 시스템 결과만 재조회하세요.');
        }
      } else if (effectiveStatus === 'denied') {
        addText(root, 'p', `연동 시스템이 조치를 거절했습니다: ${safeMessage(message)}`);
      } else if (effectiveStatus === 'failed') {
        addText(root, 'p', `연동 시스템 처리 실패: ${safeMessage(message)}`);
      } else if (effectiveStatus === 'unknown') {
        addText(root, 'p', '조치 결과를 확인할 수 없습니다. 효과가 있거나 없다고 단정하지 마세요.');
        addText(root, 'p', '제공 화면에서 연동 시스템 결과만 재조회하세요.');
      } else if (effectiveStatus === 'expired') {
        addText(root, 'p', '사람 확인 기한이 지났습니다. 이 준비 건을 실행하지 말고 제공 화면에서 조치를 다시 준비하세요.');
      } else if (effectiveStatus === 'error') {
        addText(root, 'p', `요청이 처리되지 않았습니다. 오류 코드: ${safeCode(error?.code)} · ${safeMessage(error?.message)}`);
      }

      if (message != null && message !== '' && ['prepared', 'executing', 'pending', 'denied', 'failed', 'unknown', 'expired'].includes(effectiveStatus)) {
        addField(root, '서버 메시지', safeMessage(message));
      }

      return root;
    },
  };

  // 총공세: 보호 현황의 첫 번째 학생 칸(로그인 정보) 맨 위에 관제 대시보드를 붙입니다.
  // 기존 renderIdentity 결과는 그대로 아래에 이어서 보여 줍니다. renderStatus는 바꾸지 않습니다.
  const baseRenderIdentity = view.renderIdentity;
  view.renderIdentity = function renderIdentityWithDashboard(input = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'student-identity-with-dashboard';
    const { me, devices, sessions } = input;
    const mode = me?.mode ?? devices?.mode ?? sessions?.mode;
    try {
      wrap.append(dashboard.render({ mode, devices, sessions }));
    } catch {
      const note = document.createElement('p');
      note.textContent = '대시보드를 그리지 못했습니다. 아래 기존 로그인 정보 표시는 그대로 동작합니다.';
      wrap.append(note);
    }
    wrap.append(baseRenderIdentity.call(view, input));
    return wrap;
  };

  return view;
}

// ---------------------------------------------------------------------------
// 총공세 관제 대시보드 (학생 구현)
// - 허용된 학생 API(api.get)만 씁니다. 직접 fetch·브라우저 저장·외부 전송이 없습니다.
// - 「지금 조회」를 누를 때만 조회합니다. 자동 반복 조회는 하지 않습니다.
// - 화면에는 textContent 만 씁니다. 예시 값은 쓰지 않고, 실측값에는 조회 시각과 「이 PC 실측」을 붙입니다.
// - 조회 실패·지원 없음·확인 불가를 정상이나 0건으로 바꾸지 않습니다.
// - 추이 기록은 이번 실행 중 메모리에만 두며, 앱을 다시 켜거나 새로고침하면 사라집니다.
// ---------------------------------------------------------------------------
function createDashboard(api, onChange) {
  const PC_PATH = '/api/pc/status';
  const PC_SCHEMA = 'aleph.on.pc-status.v1';
  const HISTORY_LIMIT = 20;
  const state = { loading: false, focusButton: false, pc: null, me: null, vulns: null, checkedAt: null, history: [] };
  const changed = () => { if (typeof onChange === 'function') onChange(); };

  const REASONS = {
    permission_denied: '권한 부족',
    query_failed: '조회 실패',
    timeout: '시간 초과',
    unsupported: '지원 없음',
    invalid_response: '응답 확인 불가',
    invalid_sample: '표본 확인 불가',
    cancelled: '취소됨',
  };
  const MODES = { connected: '연결됨', demo: '예제 자료(demo)', disconnected: '연결 없음', unknown: '확인 불가' };
  const SCANS = {
    complete: '모두 조회',
    partial: '일부 조회 실패',
    not_checked: '아직 조회 안 함',
    not_configured: '조회 준비 미완료',
    unverifiable: '설치 목록 확인 불가',
  };

  const reasonText = (metric) => {
    const reason = metric?.reason;
    return typeof reason === 'string' && Object.hasOwn(REASONS, reason) ? REASONS[reason] + '(' + reason + ')' : '확인 불가';
  };
  const timeText = (iso) => {
    const ms = typeof iso === 'string' ? Date.parse(iso) : NaN;
    return Number.isFinite(ms) ? new Date(ms).toLocaleTimeString('ko-KR', { hour12: false }) : '시각 확인 불가';
  };
  const gb = (bytes) => (bytes / 1024 ** 3).toFixed(1) + ' GB';
  const safeCode = (value) => (typeof value === 'string' && /^[A-Za-z0-9_.:-]{1,80}$/.test(value) ? value : 'UNKNOWN');
  const safeMessage = (value) => (typeof value === 'string' && value ? value.slice(0, 200) : '메시지 확인 불가');

  function add(parent, tag, text) {
    const element = document.createElement(tag);
    if (text != null) element.textContent = String(text);
    parent.append(element);
    return element;
  }
  function card(parent, title) {
    const box = add(parent, 'section');
    box.className = 'student-dashboard-card';
    box.style.border = '1px solid #d0d5dd';
    box.style.borderRadius = '8px';
    box.style.padding = '12px';
    box.style.minWidth = '0';
    add(box, 'h4', title);
    return box;
  }
  function meter(parent, value) {
    const m = document.createElement('meter');
    m.min = 0; m.max = 100; m.low = 70; m.high = 90; m.optimum = 0; m.value = value;
    m.style.width = '100%';
    parent.append(m);
  }

  async function get(path) {
    if (!api || typeof api.get !== 'function') return { ok: false, error: { code: 'NO_STUDENT_API', message: '학생 API를 사용할 수 없습니다.' } };
    try {
      const result = await api.get(path);
      return result && typeof result === 'object' ? result : { ok: false, error: { code: 'INVALID_RESPONSE', message: '응답 형식을 확인할 수 없습니다.' } };
    } catch {
      return { ok: false, error: { code: 'CLIENT_ERROR', message: '요청 중 오류가 발생했습니다.' } };
    }
  }

  function validPc(result) {
    const data = result?.ok ? result.data : null;
    return data && data.schema === PC_SCHEMA && data.source === 'local-pc' && Number.isFinite(Date.parse(data.measuredAt)) ? data : null;
  }

  async function refresh() {
    if (state.loading) return;
    state.loading = true;
    state.focusButton = true;
    changed();
    const [pc, me, vulns] = await Promise.all([get(PC_PATH), get('/api/me'), get('/api/vulnerabilities')]);
    state.pc = pc;
    state.me = me;
    state.vulns = vulns;
    state.checkedAt = new Date().toISOString();
    state.loading = false;
    const data = validPc(pc);
    if (data) {
      const m = data.metrics || {};
      const memOk = m.memory?.state === 'ok' && m.memory.totalBytes > 0;
      state.history.unshift({
        at: data.measuredAt,
        cpu: m.cpu?.state === 'ok' ? m.cpu.usagePercent : null,
        mem: memOk ? Math.round((1000 * m.memory.usedBytes) / m.memory.totalBytes) / 10 : null,
        warn: m.events?.state === 'ok' ? m.events.warningCount : null,
        err: m.events?.state === 'ok' ? m.events.errorCount : null,
      });
      if (state.history.length > HISTORY_LIMIT) state.history.length = HISTORY_LIMIT;
    }
    changed();
  }

  function failureLine(parent, result) {
    const code = safeCode(result?.error?.code);
    if (code === 'NOT_ALLOWED') add(parent, 'p', '지원 없음(NOT_ALLOWED): 이 앱에서는 학생 코드가 이 값을 읽을 수 없습니다.');
    else add(parent, 'p', '조회 실패(' + code + '): ' + safeMessage(result?.error?.message));
  }

  function renderPcCard(grid) {
    const box = card(grid, '① 내 PC 상태 요약');
    if (!state.pc) { add(box, 'p', '아직 조회하지 않았습니다. 「지금 조회」를 누르세요.'); return; }
    if (!state.pc.ok) { failureLine(box, state.pc); return; }
    const data = validPc(state.pc);
    if (!data) { add(box, 'p', '응답 형식을 확인할 수 없어 값을 표시하지 않습니다.'); return; }
    const m = data.metrics || {};
    if (m.cpu?.state === 'ok') { add(box, 'p', 'CPU ' + m.cpu.usagePercent + '% 사용'); meter(box, m.cpu.usagePercent); }
    else add(box, 'p', 'CPU: ' + reasonText(m.cpu));
    if (m.memory?.state === 'ok' && m.memory.totalBytes > 0) {
      const pct = Math.round((1000 * m.memory.usedBytes) / m.memory.totalBytes) / 10;
      add(box, 'p', '메모리 ' + gb(m.memory.usedBytes) + ' / ' + gb(m.memory.totalBytes) + ' (' + pct + '%)');
      meter(box, pct);
    } else add(box, 'p', '메모리: ' + reasonText(m.memory));
    if (m.disk?.state === 'ok') add(box, 'p', '디스크 여유 ' + gb(m.disk.freeBytes) + ' / ' + gb(m.disk.totalBytes));
    else add(box, 'p', '디스크: ' + reasonText(m.disk));
    if (m.firewall?.state === 'ok' && Array.isArray(m.firewall.profiles)) {
      add(box, 'p', 'Windows 방화벽 ' + m.firewall.profiles.map((p) => p.name + ' ' + (p.enabled === true ? '켜짐' : p.enabled === false ? '꺼짐' : '확인 불가')).join(' · '));
    } else add(box, 'p', 'Windows 방화벽: ' + reasonText(m.firewall));
    add(box, 'small', '이 PC 실측 · ' + timeText(data.measuredAt) + ' · 보안 서버 연결과 별도');
  }

  function statusText(resource) {
    const status = resource?.status;
    if (status === 'ok') return '조회됨(ok)';
    if (status === 'loading') return '불러오는 중(loading)';
    if (status === 'idle') return '조회 전(idle)';
    if (status === 'error') return '조회 실패(' + safeCode(resource?.error?.code) + ')';
    return '확인 불가';
  }

  function renderAccountCard(grid, input) {
    const box = card(grid, '② 계정·기기·세션 조회 상태');
    const mode = typeof input.mode === 'string' && Object.hasOwn(MODES, input.mode) ? MODES[input.mode] : '확인 불가';
    add(box, 'p', '보안 서버 연결: ' + mode);
    if (!state.me) add(box, 'p', '로그인 정보: 아직 조회 안 함');
    else if (state.me.ok) add(box, 'p', '로그인 정보: 조회됨(' + (typeof state.me.data?.user?.label === 'string' ? '사용자 확인' : '내용 확인 불가') + ')');
    else add(box, 'p', '로그인 정보: 조회 실패(' + safeCode(state.me.error?.code) + ')');
    add(box, 'p', '기기 목록: ' + statusText(input.devices));
    add(box, 'p', '세션 목록: ' + statusText(input.sessions));
    if (input.mode !== 'connected') add(box, 'small', '보안 서버에 연결되지 않으면 실제 계정·기기·세션 값이 없습니다. 연결 없음은 이상 없음이 아닙니다.');
  }

  function renderRiskCard(grid, input) {
    const box = card(grid, '③ 최근 위험 신호');
    const data = validPc(state.pc);
    const events = data?.metrics?.events;
    if (!state.pc) add(box, 'p', 'Windows 기록: 아직 조회하지 않았습니다.');
    else if (!state.pc.ok) failureLine(box, state.pc);
    else if (events?.state === 'ok') {
      add(box, 'p', 'Windows 기록 최근 24시간 경고 ' + events.warningCount + '건 · 오류 ' + events.errorCount + '건');
      if (events.truncated) add(box, 'p', '기록이 많아 최근 5,000건까지만 집계했습니다(부분 집계).');
      add(box, 'small', '이 PC 실측 · ' + timeText(data.measuredAt));
    } else add(box, 'p', 'Windows 기록: ' + reasonText(events));
    if (Array.isArray(input.notifications)) add(box, 'p', '앱 알림: ' + input.notifications.length + '건');
    add(box, 'small', '건수는 침해 판정이 아닙니다. 0건이어도 안전하다는 뜻은 아닙니다.');
  }

  function renderVulnCard(grid) {
    const box = card(grid, '④ 취약점 조회 상태');
    if (!state.vulns) { add(box, 'p', '아직 조회하지 않았습니다.'); }
    else if (!state.vulns.ok) failureLine(box, state.vulns);
    else {
      const scan = state.vulns.data?.status;
      const label = typeof scan === 'string' && Object.hasOwn(SCANS, scan) ? SCANS[scan] + '(' + scan + ')' : '확인 불가(' + String(scan ?? 'unknown') + ')';
      add(box, 'p', '전체 조회 상태: ' + label);
      if (state.checkedAt) add(box, 'small', '조회 시각 ' + timeText(state.checkedAt));
    }
    add(box, 'small', '조회 실패·미조회·준비 미완료는 취약점이 없다는 뜻이 아닙니다.');
  }

  function diff(now, before) {
    if (now == null || before == null) return '';
    const d = Math.round((now - before) * 10) / 10;
    return d === 0 ? ' (변화 없음)' : d > 0 ? ' (▲' + d + ')' : ' (▼' + Math.abs(d) + ')';
  }

  function renderHistory(root) {
    const box = add(root, 'section');
    box.className = 'student-dashboard-history';
    add(box, 'h4', '조회 추이와 기록 (이번 실행 중 최근 ' + HISTORY_LIMIT + '회)');
    add(box, 'small', '「지금 조회」를 누를 때마다 한 줄씩 쌓입니다. 저장하지 않으므로 앱을 다시 켜거나 새로고침하면 사라집니다.');
    if (!state.history.length) { add(box, 'p', '아직 기록이 없습니다.'); return; }
    const table = add(box, 'table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    const head = add(add(table, 'thead'), 'tr');
    for (const name of ['조회 시각', 'CPU %', '메모리 %', 'Windows 경고', 'Windows 오류']) {
      const th = add(head, 'th', name);
      th.scope = 'col';
      th.style.textAlign = 'left';
    }
    const body = add(table, 'tbody');
    state.history.forEach((row, index) => {
      const prev = state.history[index + 1];
      const tr = add(body, 'tr');
      add(tr, 'td', timeText(row.at));
      add(tr, 'td', row.cpu == null ? '확인 불가' : row.cpu + diff(row.cpu, prev?.cpu));
      add(tr, 'td', row.mem == null ? '확인 불가' : row.mem + diff(row.mem, prev?.mem));
      add(tr, 'td', row.warn == null ? '확인 불가' : row.warn + diff(row.warn, prev?.warn));
      add(tr, 'td', row.err == null ? '확인 불가' : row.err + diff(row.err, prev?.err));
    });
    add(box, 'small', '모든 값은 이 PC 실측입니다. 괄호는 바로 이전 조회와 비교한 변화입니다.');
  }

  return {
    render(input = {}) {
      const root = document.createElement('section');
      root.className = 'student-dashboard';
      add(root, 'h3', '모몽강 관제 대시보드');
      add(root, 'p', '학생 구현 화면입니다. 제공 「내 PC 상태」와 별도로, 허용된 학생 API로 받은 값만 보여 줍니다.');

      const bar = add(root, 'p');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = state.loading ? '조회 중…' : '지금 조회';
      button.disabled = state.loading;
      button.addEventListener('click', () => { refresh(); });
      bar.append(button);
      add(bar, 'span', state.checkedAt ? ' 마지막 조회 ' + timeText(state.checkedAt) : ' 아직 조회하지 않았습니다. 자동 조회는 하지 않습니다.');
      if (state.focusButton && !state.loading) {
        state.focusButton = false;
        queueMicrotask(() => { if (button.isConnected) button.focus(); });
      }

      const grid = add(root, 'div');
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';
      grid.style.gap = '12px';
      grid.style.margin = '12px 0';
      renderPcCard(grid);
      renderAccountCard(grid, input);
      renderRiskCard(grid, input);
      renderVulnCard(grid);

      renderHistory(root);
      return root;
    },
  };
}
