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
        // 총공세: 같은 코드·같은 문구의 알림은 한 줄로 묶어 반복을 줄입니다. 코드와 서버 문구는 그대로 둡니다.
        const RESOURCE_NAMES = { me: '로그인 정보', apps: '업무 앱', events: '보안 기록', devices: '기기', sessions: '세션' };
        const openKeys = (this.notificationOpenKeys ??= new Set());
        const groups = new Map();
        for (const notification of notifications) {
          const resource = String(notification?.resource ?? '확인 불가');
          const code = String(notification?.code ?? '확인 불가');
          const message = String(notification?.message ?? '확인 불가');
          const key = code + '\u0000' + message;
          if (!groups.has(key)) groups.set(key, { code, message, resources: [], items: [] });
          groups.get(key).resources.push(Object.hasOwn(RESOURCE_NAMES, resource) ? RESOURCE_NAMES[resource] : resource);
          groups.get(key).items.push({ resource, code, message });
        }
        addText(notificationPanel, 'p', `알림 ${notifications.length}건${groups.size < notifications.length ? ` · 같은 내용 ${groups.size}종류로 묶음` : ''}`).className = 'muted';
        const list = document.createElement('ul');
        list.className = 'plain-list student-notification-groups';
        for (const group of groups.values()) {
          const row = document.createElement('li');
          row.style.display = 'block';
          const message = document.createElement('p');
          message.style.margin = '0';
          message.textContent = group.message;
          const meta = document.createElement('p');
          meta.className = 'muted';
          meta.style.margin = '2px 0 0';
          meta.textContent = `대상: ${group.resources.join(' · ')} · 코드: ${group.code}`;
          row.append(message, meta);
          // 세부 내역: 묶기 전 알림을 한 줄씩 그대로 보여 줍니다. 펼침 상태는 다시 그려도 유지합니다.
          const key = group.code + '\u0000' + group.message;
          const details = document.createElement('details');
          details.className = 'student-notification-details';
          details.style.marginTop = '4px';
          details.open = openKeys.has(key);
          details.addEventListener('toggle', () => { if (details.open) openKeys.add(key); else openKeys.delete(key); });
          const summary = document.createElement('summary');
          summary.textContent = '세부 내역 ' + group.items.length + '건 보기';
          summary.style.cursor = 'pointer';
          summary.style.color = 'var(--muted)';
          summary.style.fontSize = '0.875rem';
          const detailList = document.createElement('ul');
          detailList.style.margin = '4px 0 0';
          detailList.style.paddingLeft = '18px';
          for (const item of group.items) {
            const detailRow = document.createElement('li');
            detailRow.textContent = item.resource + ' · 코드: ' + item.code + ' · ' + item.message;
            detailList.append(detailRow);
          }
          details.append(summary, detailList);
          row.append(details);
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
// 총공세 관제 대시보드 (학생 구현) · 7판
// - 허용된 학생 API(api.get)만 씁니다. 직접 fetch·브라우저 저장·외부 전송이 없습니다.
// - 앱을 열 때 한 번 조회하고, 그 뒤에는 「지금 조회」를 누를 때만 조회합니다. 자동 반복 조회는 하지 않습니다.
// - 화면에는 textContent 만 씁니다. 예시 값은 쓰지 않고, 실측값에는 조회 시각과 「이 PC 실측」을 붙입니다.
// - 조회 실패·지원 없음·확인 불가·연결 없음을 정상이나 0건으로 바꾸지 않습니다.
// - 추이 기록은 이번 실행 중 메모리에만 두며, 앱을 다시 켜거나 새로고침하면 사라집니다.
// - Impeccable(pbakaus/impeccable, Apache 2.0)의 critique·clarify·craft-floor·operate 지침을 참고했습니다.
//   5판: 앱 전체 어두운 테마(public/style.css 끝의 색 변수)를 따르도록 앱 색 변수만 씁니다.
//   상태는 색만으로 구분하지 않고 점 + 글자로 함께 표시합니다(Carbon 상태 표시 패턴).
//   카드마다 큰 값 하나와 짧은 설명 한 줄만 보이게 하고, 자세한 근거는 「자세히 보기」에 접어 둡니다.
// ---------------------------------------------------------------------------
function createDashboard(api, onChange) {
  const DASHBOARD_VERSION = 7;
  const PC_PATH = '/api/pc/status';
  const PC_SCHEMA = 'aleph.on.pc-status.v1';
  const HISTORY_LIMIT = 20;
  const HISTORY_VISIBLE = 5;
  const state = { started: false, loading: false, focusButton: false, detailsOpen: false, historyOpen: false, pc: null, me: null, vulns: null, checkedAt: null, history: [] };
  const changed = () => { if (typeof onChange === 'function') onChange(); };

  const REASONS = {
    permission_denied: '권한이 없어 읽지 못함',
    query_failed: '읽지 못함',
    timeout: '시간 안에 읽지 못함',
    unsupported: '이 PC에서 지원하지 않음',
    invalid_response: '값을 확인할 수 없음',
    invalid_sample: '값을 확인할 수 없음',
    cancelled: '조회가 취소됨',
  };
  const SCANS = {
    complete: '모두 조회함',
    partial: '일부만 조회함',
    not_checked: '조회 안 함',
    not_configured: '준비 안 됨',
    unverifiable: '확인 불가',
  };
  const RESOURCE = { ok: '불러옴', loading: '불러오는 중', idle: '조회 전', error: '불러오지 못함' };
  // 앱 색 변수만 씁니다. 밝은 테마·어두운 테마 어느 쪽이든 앱과 같은 색으로 보입니다.
  // 상태 색(allow·challenge·deny·unknown)은 앱이 고정한 의미 색입니다.
  const DARK = {
    panel: 'var(--surface)', tile: 'var(--bg)', line: 'var(--border)', text: 'var(--text)', muted: 'var(--muted)',
    accent: 'var(--accent)', ok: 'var(--allow)', warn: 'var(--challenge)', fail: 'var(--deny)', unknown: 'var(--unknown)',
  };
  // 상태는 점의 색 + 글자로 함께 보여 줍니다. 「정상」「안전」 같은 판정 대신 무엇을 했는지만 말합니다.
  const TONE = {
    normal: { color: DARK.ok, label: '측정됨' },
    info: { color: DARK.ok, label: '측정됨' },
    warn: { color: DARK.warn, label: '주의' },
    fail: { color: DARK.fail, label: '주의 높음' },
    unknown: { color: DARK.unknown, label: '확인 불가' },
    idle: { color: DARK.unknown, label: '조회 전' },
  };

  const pad = (n) => String(n).padStart(2, '0');
  const timeText = (iso) => {
    const ms = typeof iso === 'string' ? Date.parse(iso) : NaN;
    if (!Number.isFinite(ms)) return '시각 확인 불가';
    const d = new Date(ms);
    return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  };
  const gb = (bytes) => Math.round(bytes / 1024 ** 3) + ' GB';
  const gb1 = (bytes) => (bytes / 1024 ** 3).toFixed(1) + ' GB';
  const safeCode = (value) => (typeof value === 'string' && /^[A-Za-z0-9_.:-]{1,80}$/.test(value) ? value : 'UNKNOWN');
  const reasonText = (metric) => {
    const reason = metric?.reason;
    return typeof reason === 'string' && Object.hasOwn(REASONS, reason) ? REASONS[reason] : '값을 확인할 수 없음';
  };

  function add(parent, tag, text, className) {
    const element = document.createElement(tag);
    if (text != null) element.textContent = String(text);
    if (className) element.className = className;
    parent.append(element);
    return element;
  }
  function muted(parent, text, tag = 'p') {
    const element = add(parent, tag, text);
    element.style.color = DARK.muted;
    element.style.fontSize = '0.875rem';
    element.style.margin = '0';
    return element;
  }
  function label(parent, text) {
    const element = add(parent, 'h4', text);
    element.style.color = DARK.muted;
    element.style.fontSize = '0.8rem';
    element.style.fontWeight = '600';
    element.style.letterSpacing = '0.02em';
    element.style.margin = '0';
    return element;
  }
  function dot(parent, tone) {
    const t = TONE[tone] || TONE.unknown;
    const wrap = add(parent, 'span');
    wrap.style.display = 'inline-flex';
    wrap.style.alignItems = 'center';
    wrap.style.gap = '6px';
    wrap.style.fontSize = '0.8rem';
    wrap.style.fontWeight = '600';
    wrap.style.color = t.color;
    const mark = add(wrap, 'span');
    mark.setAttribute('aria-hidden', 'true');
    mark.style.width = '8px';
    mark.style.height = '8px';
    mark.style.borderRadius = '50%';
    mark.style.background = tone === 'idle' ? 'transparent' : t.color;
    mark.style.border = '1.5px solid ' + t.color;
    mark.style.flex = 'none';
    add(wrap, 'span', t.label);
    return wrap;
  }
  function kv(parent, rows) {
    const dl = add(parent, 'dl');
    dl.style.display = 'grid';
    dl.style.gridTemplateColumns = 'minmax(84px, max-content) minmax(0, 1fr)';
    dl.style.gap = '6px 16px';
    dl.style.margin = '6px 0 16px';
    for (const [name, value] of rows) {
      const dt = add(dl, 'dt', name);
      dt.style.color = DARK.muted;
      const dd = add(dl, 'dd', value);
      dd.style.margin = '0';
      dd.style.overflowWrap = 'anywhere';
    }
    return dl;
  }

  async function get(path) {
    if (!api || typeof api.get !== 'function') return { ok: false, error: { code: 'NO_STUDENT_API' } };
    try {
      const result = await api.get(path);
      return result && typeof result === 'object' ? result : { ok: false, error: { code: 'INVALID_RESPONSE' } };
    } catch {
      return { ok: false, error: { code: 'CLIENT_ERROR' } };
    }
  }
  function validPc(result) {
    const data = result?.ok ? result.data : null;
    return data && data.schema === PC_SCHEMA && data.source === 'local-pc' && Number.isFinite(Date.parse(data.measuredAt)) ? data : null;
  }
  const memPercent = (m) => (m.memory?.state === 'ok' && m.memory.totalBytes > 0 ? Math.round((1000 * m.memory.usedBytes) / m.memory.totalBytes) / 10 : null);

  async function refresh({ focus = true } = {}) {
    if (state.loading) return;
    state.loading = true;
    state.focusButton = focus;
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
      state.history.unshift({
        at: data.measuredAt,
        cpu: m.cpu?.state === 'ok' ? m.cpu.usagePercent : null,
        mem: memPercent(m),
        warn: m.events?.state === 'ok' ? m.events.warningCount : null,
        err: m.events?.state === 'ok' ? m.events.errorCount : null,
      });
      if (state.history.length > HISTORY_LIMIT) state.history.length = HISTORY_LIMIT;
    }
    changed();
  }

  // 실패 문구: 무엇이 안 됐는지 먼저, 코드는 자세히 보기에서만.
  function failText(result, what) {
    const code = safeCode(result?.error?.code);
    if (code === 'NOT_ALLOWED') return { value: '지원 안 됨', sub: '이 앱 버전에서는 ' + what + ' 읽을 수 없습니다', tone: 'unknown', code };
    if (code === 'ENGINE_NOT_CONNECTED') return { value: '연결 없음', sub: '보안 서버에 연결되지 않아 ' + what + ' 불러오지 못했습니다', tone: 'unknown', code };
    return { value: '불러오지 못함', sub: '다시 조회하고, 계속되면 앱을 다시 켜세요', tone: 'fail', code };
  }

  // 카드 네 개의 요약(큰 값 하나 + 한 줄)
  function pcTile() {
    if (!state.pc) return { value: '—', sub: 'CPU·메모리·디스크·방화벽', tone: 'idle' };
    if (!state.pc.ok) return failText(state.pc, '이 PC 값을');
    const data = validPc(state.pc);
    if (!data) return { value: '확인 불가', sub: '받은 값의 형식을 확인할 수 없음', tone: 'unknown' };
    const m = data.metrics || {};
    const cpu = m.cpu?.state === 'ok' ? m.cpu.usagePercent : null;
    const mem = memPercent(m);
    const value = ['CPU ' + (cpu == null ? '확인 불가' : Math.round(cpu) + '%'), '메모리 ' + (mem == null ? '확인 불가' : Math.round(mem) + '%')];
    const parts = [];
    if (m.disk?.state === 'ok') parts.push('디스크 여유 ' + gb(m.disk.freeBytes));
    if (m.firewall?.state === 'ok' && Array.isArray(m.firewall.profiles)) {
      const on = m.firewall.profiles.filter((p) => p.enabled === true).length;
      parts.push('방화벽 ' + on + '/' + m.firewall.profiles.length + ' 켜짐');
    } else parts.push('방화벽 확인 불가');
    const high = (cpu != null && cpu >= 90) || (mem != null && mem >= 90);
    const busy = (cpu != null && cpu >= 70) || (mem != null && mem >= 70);
    return { value, sub: parts.join(' · '), tone: high ? 'fail' : busy ? 'warn' : 'normal', badge: high ? '사용량 매우 많음' : busy ? '사용량 많음' : null };
  }
  function connectionTile(input) {
    if (input.mode === 'connected') return { value: '연결됨', sub: '로그인·기기·세션을 보안 서버에서 불러옴', tone: 'normal' };
    if (input.mode === 'demo') return { value: '예제 자료', sub: '실제 값이 아닙니다(demo)', tone: 'warn' };
    if (input.mode === 'disconnected') return { value: '연결 없음', sub: '로그인·기기·세션 값 없음 · 이상 없음이 아님', tone: 'unknown', status: '연결 없음' };
    return { value: '확인 불가', sub: '연결 상태를 확인할 수 없음', tone: 'unknown' };
  }
  function riskTile() {
    if (!state.pc) return { value: '—', sub: '최근 24시간 Windows 기록', tone: 'idle' };
    if (!state.pc.ok) return failText(state.pc, 'Windows 기록을');
    const events = validPc(state.pc)?.metrics?.events;
    if (events?.state === 'ok') {
      return { value: '경고 ' + events.warningCount + ' · 오류 ' + events.errorCount, sub: '최근 24시간 · 침해 판정 아님' + (events.truncated ? ' · 부분 집계' : ''), tone: 'info' };
    }
    return { value: '확인 불가', sub: 'Windows 기록: ' + reasonText(events), tone: 'unknown' };
  }
  function vulnTile() {
    if (!state.vulns) return { value: '—', sub: '설치 패키지 취약점', tone: 'idle' };
    if (!state.vulns.ok) return failText(state.vulns, '조회 결과를');
    const scan = state.vulns.data?.status;
    const known = typeof scan === 'string' && Object.hasOwn(SCANS, scan);
    if (scan === 'complete') return { value: '모두 조회함', sub: '결과는 제공 「설치 패키지」 칸에서 확인', tone: 'normal' };
    return { value: known ? SCANS[scan] : '확인 불가', sub: String(scan ?? 'unknown') + ' · 취약점 없음이 아님', tone: 'unknown' };
  }

  function tile(grid, title, info) {
    const box = add(grid, 'section', null, 'student-dashboard-tile');
    box.style.background = DARK.tile;
    box.style.border = '1px solid ' + DARK.line;
    box.style.borderRadius = '10px';
    box.style.padding = '14px 16px';
    box.style.minWidth = '0';
    const top = add(box, 'div');
    top.style.display = 'flex';
    top.style.justifyContent = 'space-between';
    top.style.alignItems = 'center';
    top.style.gap = '8px';
    label(top, title);
    const status = dot(top, info.tone);
    if (info.status) status.lastChild.textContent = info.status;
    const value = add(box, 'p');
    (Array.isArray(info.value) ? info.value : [info.value]).forEach((part) => { add(value, 'span', part).style.display = 'block'; });
    value.style.fontSize = '1.3rem';
    value.style.lineHeight = '1.3';
    value.style.fontWeight = '650';
    value.style.fontVariantNumeric = 'tabular-nums';
    value.style.margin = '10px 0 4px';
    // 핵심 수치 색은 테마의 --value 를 쓰고, 없으면 본문 글자색을 씁니다.
    // 측정값 글자색은 그 칸의 상태 점 색과 같습니다(측정됨 초록, 주의 노랑·빨강).
    // 연결 없음·확인 불가·조회 전은 옅은 보조 글자색으로 둡니다(강조로 오해되지 않게).
    value.style.color = info.tone === 'idle' || info.tone === 'unknown' ? DARK.muted : (TONE[info.tone] || TONE.normal).color;
    value.style.overflowWrap = 'anywhere';
    if (info.badge) {
      const badge = add(box, 'p', info.badge);
      badge.style.margin = '0 0 4px';
      badge.style.fontSize = '0.8rem';
      badge.style.fontWeight = '600';
      badge.style.color = TONE[info.tone]?.color ?? DARK.warn;
    }
    muted(box, info.sub);
  }

  function renderDetails(root, input) {
    const details = add(root, 'details');
    details.open = state.detailsOpen;
    details.addEventListener('toggle', () => { state.detailsOpen = details.open; });
    details.style.margin = '0 0 12px';
    details.style.borderTop = '1px solid ' + DARK.line;
    details.style.paddingTop = '10px';
    const summaryEl = add(details, 'summary', '자세히 보기 · 근거와 오류 코드');
    summaryEl.style.cursor = 'pointer';
    summaryEl.style.color = DARK.accent;
    summaryEl.style.fontSize = '0.875rem';
    const body = add(details, 'div');
    body.style.paddingTop = '12px';

    label(body, '내 PC 상태');
    const data = validPc(state.pc);
    if (data) {
      const m = data.metrics || {};
      const mem = memPercent(m);
      kv(body, [
        ['CPU', m.cpu?.state === 'ok' ? m.cpu.usagePercent + '% 사용' : reasonText(m.cpu)],
        ['메모리', mem != null ? gb1(m.memory.usedBytes) + ' / ' + gb1(m.memory.totalBytes) + ' (' + mem + '%)' : reasonText(m.memory)],
        ['디스크 여유', m.disk?.state === 'ok' ? gb1(m.disk.freeBytes) + ' / ' + gb1(m.disk.totalBytes) : reasonText(m.disk)],
        ['방화벽', m.firewall?.state === 'ok' && Array.isArray(m.firewall.profiles)
          ? m.firewall.profiles.map((p) => p.name + ' ' + (p.enabled === true ? '켜짐' : p.enabled === false ? '꺼짐' : '확인 불가')).join(' · ')
          : reasonText(m.firewall)],
        ['기준', '사용량 70% 이상 많음, 90% 이상 매우 많음'],
        ['출처', '이 PC 실측 · ' + timeText(data.measuredAt)],
      ]);
    } else { const m = muted(body, state.pc ? '이 PC 값을 불러오지 못했습니다. 오류 코드: ' + safeCode(state.pc.error?.code) : '아직 조회하지 않았습니다.'); m.style.margin = '6px 0 16px'; }

    label(body, '보안 서버 연결');
    const meText = !state.me ? '조회 전' : state.me.ok ? '불러옴' : '불러오지 못함';
    const codes = [state.me?.ok === false ? state.me.error?.code : null, input.devices?.error?.code, input.sessions?.error?.code].filter(Boolean).map(safeCode);
    kv(body, [
      ['로그인 정보', meText],
      ['기기 목록', RESOURCE[input.devices?.status] ?? '확인 불가'],
      ['세션 목록', RESOURCE[input.sessions?.status] ?? '확인 불가'],
      ['오류 코드', codes.length ? [...new Set(codes)].join(', ') : '없음'],
      ['다음 할 일', input.mode === 'connected' ? '없음' : '보안 서버(SDP) 연결은 담당자 설정이 필요합니다'],
    ]);

    label(body, '최근 위험 신호');
    const events = data?.metrics?.events;
    kv(body, [
      ['범위', 'Windows System·Application 기록, 최근 24시간, 최대 5,000건'],
      ['결과', events?.state === 'ok' ? '경고 ' + events.warningCount + '건 · 오류 ' + events.errorCount + '건' + (events.truncated ? ' (부분 집계)' : '') : state.pc ? reasonText(events) : '조회 전'],
      ...(Array.isArray(input.notifications) ? [['앱 알림', input.notifications.length + '건']] : []),
      ['읽는 법', '건수는 침해 판정이 아니며, 0건도 안전하다는 뜻이 아닙니다'],
    ]);

    label(body, '취약점 조회');
    kv(body, [
      ['상태', !state.vulns ? '조회 전' : state.vulns.ok ? String(state.vulns.data?.status ?? 'unknown') : '불러오지 못함(' + safeCode(state.vulns.error?.code) + ')'],
      ['조회 시각', state.checkedAt ? timeText(state.checkedAt) : '조회 전'],
      ['읽는 법', '조회하지 않았거나 준비가 안 된 상태는 취약점이 없다는 뜻이 아닙니다'],
    ]);
  }

  function historyTable(parent, rows, offset) {
    const table = add(parent, 'table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.fontVariantNumeric = 'tabular-nums';
    const head = add(add(table, 'thead'), 'tr');
    ['시각', 'CPU %', '메모리 %', '경고', '오류'].forEach((name, i) => {
      const th = add(head, 'th', name);
      th.scope = 'col';
      th.style.textAlign = i === 0 ? 'left' : 'right';
      th.style.padding = '6px 8px';
      th.style.color = DARK.muted;
      th.style.fontWeight = '500';
      th.style.fontSize = '0.875rem';
      th.style.borderBottom = '1px solid ' + DARK.line;
    });
    const body = add(table, 'tbody');
    const diff = (now, before) => {
      if (now == null || before == null) return '';
      const d = Math.round((now - before) * 10) / 10;
      return d === 0 ? '' : d > 0 ? ' (+' + d + ')' : ' (' + d + ')';
    };
    rows.forEach((row, index) => {
      const prev = state.history[offset + index + 1];
      const tr = add(body, 'tr');
      [
        timeText(row.at),
        row.cpu == null ? '확인 불가' : row.cpu.toFixed(1) + diff(row.cpu, prev?.cpu),
        row.mem == null ? '확인 불가' : row.mem.toFixed(1) + diff(row.mem, prev?.mem),
        row.warn == null ? '확인 불가' : row.warn + diff(row.warn, prev?.warn),
        row.err == null ? '확인 불가' : row.err + diff(row.err, prev?.err),
      ].forEach((text, i) => {
        const td = add(tr, 'td', text);
        if (text === '확인 불가') td.style.color = DARK.muted;
        td.style.textAlign = i === 0 ? 'left' : 'right';
        td.style.padding = '6px 8px';
        td.style.borderBottom = '1px solid ' + DARK.line;
      });
    });
  }

  function renderHistory(root) {
    const box = add(root, 'section', null, 'student-dashboard-history');
    box.style.borderTop = '1px solid ' + DARK.line;
    box.style.paddingTop = '12px';
    label(box, '조회 추이 · 이 PC 실측');
    if (!state.history.length) {
      muted(box, '조회할 때마다 한 줄씩 쌓입니다. 저장하지 않아 새로고침하면 사라집니다.').style.marginTop = '6px';
      return;
    }
    historyTable(box, state.history.slice(0, HISTORY_VISIBLE), 0);
    const rest = state.history.slice(HISTORY_VISIBLE);
    const foot = muted(box, '괄호는 바로 전 조회와의 차이 · 최근 ' + HISTORY_LIMIT + '회까지 보관 · 새로고침하면 사라짐');
    foot.style.marginTop = '6px';
    if (rest.length) {
      const more = add(box, 'details');
      more.open = state.historyOpen;
      more.addEventListener('toggle', () => { state.historyOpen = more.open; });
      const s = add(more, 'summary', '이전 기록 ' + rest.length + '건 더 보기');
      s.style.cursor = 'pointer';
      s.style.color = DARK.accent;
      s.style.fontSize = '0.875rem';
      historyTable(more, rest, HISTORY_VISIBLE);
    }
  }

  // 네 칸의 상태를 고리 조각 네 개로 그립니다. 장식이 아니라 칸 상태의 색을 그대로 옮긴 것이고, 글자와 점으로도 같은 내용을 알립니다.
  function ring(parent, tones, counts) {
    const NS = 'http://www.w3.org/2000/svg';
    const box = add(parent, 'div');
    box.style.position = 'relative';
    box.style.width = '112px';
    box.style.height = '112px';
    box.style.flex = 'none';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 140 140');
    svg.setAttribute('width', '112');
    svg.setAttribute('height', '112');
    svg.setAttribute('aria-hidden', 'true');
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('transform', 'rotate(-90 70 70)');
    g.setAttribute('fill', 'none');
    g.setAttribute('stroke-width', '11');
    g.setAttribute('stroke-linecap', 'round');
    const circ = 2 * Math.PI * 54;
    tones.forEach((tone, i) => {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', '70');
      c.setAttribute('cy', '70');
      c.setAttribute('r', '54');
      c.setAttribute('stroke', (TONE[tone] || TONE.unknown).color);
      c.setAttribute('stroke-dasharray', (circ / tones.length - 9) + ' ' + circ);
      c.setAttribute('stroke-dashoffset', String(-(circ / tones.length) * i));
      if (tone === 'idle') c.setAttribute('opacity', '0.5');
      g.append(c);
    });
    svg.append(g);
    box.append(svg);
    const center = add(box, 'div');
    center.style.position = 'absolute';
    center.style.inset = '0';
    center.style.display = 'flex';
    center.style.flexDirection = 'column';
    center.style.alignItems = 'center';
    center.style.justifyContent = 'center';
    center.style.textAlign = 'center';
    const [name, tone] = counts['주의'] ? ['주의', 'warn'] : counts['확인 불가'] ? ['확인 불가', 'unknown'] : counts['조회 전'] ? ['조회 전', 'idle'] : ['측정됨', 'normal'];
    muted(center, '현재 상태').style.fontSize = '0.7rem';
    const big = add(center, 'strong', name);
    big.style.color = tone === 'idle' || tone === 'unknown' ? DARK.muted : (TONE[tone] || TONE.normal).color;
    big.style.fontSize = name.length > 3 ? '1rem' : '1.3rem';
    big.style.lineHeight = '1.2';
  }

  // ZTNA 접속 경로: 업무 앱에 닿기까지 확인하는 순서와 지금 알 수 있는 상태만 보여 줍니다.
  // 서버가 판정하는 단계는 연결이 없으면 「대기」로 비워 둡니다. 비어 있음은 이상 없음이 아닙니다.
  function accessPath(parent, input, pc) {
    const box = add(parent, 'section', null, 'student-dashboard-path');
    box.style.margin = '0 0 12px';
    label(box, '제로 트러스트 접속 경로 · ZTNA').style.marginBottom = '8px';
    const list = add(box, 'ol');
    list.style.listStyle = 'none';
    list.style.margin = '0';
    list.style.padding = '0';
    list.style.display = 'grid';
    list.style.gridTemplateColumns = 'repeat(auto-fit, minmax(130px, 1fr))';
    list.style.gap = '8px';
    const loaded = input.mode === 'demo' ? '예제(demo)' : '불러옴';
    const resource = (r) => (r?.status === 'ok' ? ['normal', loaded] : r?.status === 'loading' || r?.status === 'idle' || r == null ? ['idle', '조회 전'] : ['unknown', '확인 불가']);
    const user = !state.me ? ['idle', '조회 전'] : state.me.ok ? ['normal', loaded] : ['unknown', '확인 불가'];
    const steps = [
      ['1 · 사용자', ...user],
      ['2 · 기기 상태', pc.tone === 'idle' ? 'idle' : pc.tone, pc.tone === 'idle' ? '조회 전' : (TONE[pc.tone] || TONE.unknown).label],
      ['3 · 세션', ...resource(input.sessions)],
      ['4 · 정책 판정', 'idle', input.mode === 'connected' ? '접속 요청 때' : '대기'],
      ['5 · 업무 앱', 'idle', '접속 전'],
    ];
    for (const [title, tone, text] of steps) {
      const li = add(list, 'li');
      const measured = tone === 'normal' || tone === 'warn' || tone === 'fail' || tone === 'info';
      li.style.padding = '10px 12px';
      li.style.background = DARK.tile;
      li.style.borderRadius = '8px';
      li.style.border = '1px ' + (measured ? 'solid ' + (TONE[tone] || TONE.normal).color : 'dashed ' + DARK.line);
      li.style.minWidth = '0';
      muted(li, title).style.fontSize = '0.75rem';
      const state2 = add(li, 'strong', text);
      state2.style.display = 'block';
      state2.style.marginTop = '4px';
      state2.style.color = measured ? (TONE[tone] || TONE.normal).color : DARK.muted;
    }
    muted(box, input.mode === 'connected' ? '정책 판정은 업무 앱에 접속을 요청할 때 서버가 내립니다.'
      : input.mode === 'demo' ? '사용자·세션은 예제 자료입니다(demo). 실제 값이 아니며 정책 판정은 하지 않습니다.'
      : '서버에 연결되지 않아 사용자·세션·정책은 비어 있습니다. 이상 없음이 아닙니다.').style.marginTop = '8px';
  }

  return {
    version: DASHBOARD_VERSION,
    render(input = {}) {
      const root = document.createElement('section');
      root.className = 'student-dashboard';
      root.style.color = DARK.text;
      root.style.margin = '0 0 20px';
      root.style.paddingBottom = '16px';
      root.style.borderBottom = '1px solid ' + DARK.line;

      const header = add(root, 'div');
      header.style.display = 'flex';
      header.style.flexWrap = 'wrap';
      header.style.alignItems = 'center';
      header.style.justifyContent = 'space-between';
      header.style.gap = '8px 16px';
      header.style.marginBottom = '12px';
      const titles = add(header, 'div');
      const h3 = add(titles, 'h3', '모몽강 관제 대시보드');
      h3.style.color = DARK.text;
      h3.style.fontSize = '1.1rem';
      const status = muted(titles, state.loading
        ? '이 PC 값과 연결 상태를 읽는 중입니다.'
        : state.checkedAt ? '마지막 조회 ' + timeText(state.checkedAt) + ' · 앱을 열 때 한 번 조회, 이후에는 직접 눌러야 바뀝니다' : '이 PC 값을 읽을 준비를 하는 중입니다.');
      status.style.marginTop = '2px';
      status.style.fontVariantNumeric = 'tabular-nums';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      const button = add(header, 'button', state.loading ? '조회 중…' : '지금 조회', 'btn');
      button.type = 'button';
      button.style.borderColor = DARK.accent;
      button.style.color = DARK.accent;
      button.style.fontWeight = '600';
      button.disabled = state.loading;
      button.addEventListener('click', () => { refresh(); });
      // 앱을 열 때 한 번만 조회합니다. 초점은 옮기지 않습니다.
      if (!state.started) {
        state.started = true;
        queueMicrotask(() => { refresh({ focus: false }); });
      }
      if (state.focusButton && !state.loading) {
        state.focusButton = false;
        queueMicrotask(() => { if (button.isConnected) button.focus(); });
      }

      const grid = add(root, 'div');
      grid.style.display = 'grid';
      // 네 칸이 3+1로 어긋나지 않도록 넓으면 2열, 좁으면 1열로만 바뀝니다.
      grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(max(220px, calc((100% - 12px) / 2)), 1fr))';
      grid.style.gap = '12px';
      grid.style.marginBottom = '12px';
      const tiles = [['내 PC 상태', pcTile()], ['보안 서버 연결', connectionTile(input)], ['최근 위험 신호', riskTile()], ['취약점 조회', vulnTile()]];
      // 상태 요약: 네 칸의 상태를 세기만 합니다. 「안전」 같은 종합 판정은 만들지 않습니다.
      const counts = { 주의: 0, '확인 불가': 0, 측정됨: 0, '조회 전': 0 };
      for (const [, info] of tiles) {
        if (info.tone === 'warn' || info.tone === 'fail') counts['주의'] += 1;
        else if (info.tone === 'unknown') counts['확인 불가'] += 1;
        else if (info.tone === 'idle') counts['조회 전'] += 1;
        else counts['측정됨'] += 1;
      }
      // 8판: 상태 요약을 고리 + 개수로 보여 줍니다. 고리 가운데 글자도 세기만 옮긴 것이며 종합 판정이 아닙니다.
      const summary = add(root, 'div', null, 'student-dashboard-summary');
      summary.style.display = 'flex';
      summary.style.flexWrap = 'wrap';
      summary.style.alignItems = 'center';
      summary.style.gap = '12px 24px';
      summary.style.margin = '0 0 16px';
      ring(summary, tiles.map(([, info]) => info.tone), counts);
      const rollup = add(summary, 'p');
      rollup.style.display = 'flex';
      rollup.style.flexDirection = 'column';
      rollup.style.gap = '6px';
      rollup.style.margin = '0';
      rollup.style.fontSize = '0.875rem';
      rollup.setAttribute('aria-label', '상태 요약');
      for (const [name, tone] of [['주의', 'warn'], ['확인 불가', 'unknown'], ['측정됨', 'normal'], ['조회 전', 'idle']]) {
        if (!counts[name]) continue;
        const chip = dot(rollup, tone);
        chip.lastChild.textContent = name + ' ' + counts[name];
      }
      root.insertBefore(summary, grid);
      for (const [title, info] of tiles) tile(grid, title, info);
      accessPath(root, input, tiles[0][1]);

      renderDetails(root, input);
      renderHistory(root);
      return root;
    },
  };
}
