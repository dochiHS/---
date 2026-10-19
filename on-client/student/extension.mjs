// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계를 통과하지 않습니다.
export function createStudentView() {
  return {
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
        if (error?.code === 'CONTRACT_MISMATCH' || error?.code === 'ENGINE_RESULT_UNVERIFIED') {
          addText(root, 'p', `확인 불가: 기록 응답 형식을 확인할 수 없습니다. ${message}`);
        } else {
          addText(root, 'p', `기록을 불러오지 못했습니다: ${message}`);
        }
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
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
