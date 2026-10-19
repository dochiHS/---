// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
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
    renderDecision() { return '학생 구현 대기: 서버의 판정과 이유를 연결하세요.'; },
    renderEvents() { return '학생 구현 대기: 본인 접속·XDR 기록을 연결하세요.'; },
    renderStatus() { return '학생 구현 대기: 기기·세션·알림과 연결 점검 상태를 구분하세요.'; },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
