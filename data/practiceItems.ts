import type { PracticeItem } from '../lib/types';

const review = {
  status: 'published' as const,
  reviewedBy: 'Spanish Lab · 스페인어 연구소',
  reviewedAt: '2026-07-11',
};

export const practiceItems = [
  // Lectura · Tarea 1 — Una biblioteca donde no se prestan libros
  {
    id: 'r-lib-01',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t1-biblioteca-objetos',
    prompt: '¿Con qué objetivo principal se creó la biblioteca de las cosas?',
    options: [
      { key: 'a', text: 'Exponer objetos antiguos del municipio.' },
      { key: 'b', text: 'Compartir productos de uso ocasional.' },
      { key: 'c', text: 'Vender aparatos reparados a bajo precio.' },
    ],
    correctAnswer: 'b',
    explanationKo:
      '첫 문단의 핵심은 주민들이 1년에 몇 번만 쓰는 도구와 기기를 빌릴 수 있게 하는 것입니다. 전시나 판매가 아니라 공동 사용이 목적이므로 b가 정답입니다.',
    tags: ['목적', '세부정보', '환경'],
    ...review,
  },
  {
    id: 'r-lib-02',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t1-biblioteca-objetos',
    prompt: '¿Qué reveló la encuesta sobre los residuos domésticos?',
    options: [
      { key: 'a', text: 'Muchos aparatos se desechaban aunque todavía funcionaban.' },
      { key: 'b', text: 'La mayoría de las familias no sabía reparar herramientas.' },
      { key: 'c', text: 'Los vecinos preferían alquilar antes que comprar.' },
    ],
    correctAnswer: 'a',
    explanationKo:
      '설문에서는 고장 때문이 아니라 보관 공간 부족으로 기기를 버리는 경우가 많았다고 합니다. 아직 작동하는 물건도 폐기되었다는 a가 이를 정확히 바꿔 말합니다.',
    tags: ['세부정보', '바꿔쓰기', '환경'],
    ...review,
  },
  {
    id: 'r-lib-03',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t1-biblioteca-objetos',
    prompt: '¿Qué condición se exige para utilizar el servicio?',
    options: [
      { key: 'a', text: 'Donar al menos un objeto útil.' },
      { key: 'b', text: 'Pagar una cuota mensual.' },
      { key: 'c', text: 'Recibir una explicación sobre el uso responsable.' },
    ],
    correctAnswer: 'c',
    explanationKo:
      '회원이 되려면 거주·근무 조건과 함께 책임 있는 사용법에 대한 짧은 세션에 참석해야 합니다. 기증이나 월회비는 필수 조건이 아니므로 c가 정답입니다.',
    tags: ['조건', '세부정보'],
    ...review,
  },
  {
    id: 'r-lib-04',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t1-biblioteca-objetos',
    prompt: '¿Por qué revisa el equipo técnico los objetos donados?',
    options: [
      { key: 'a', text: 'Para decidir cuánto debe pagar el donante.' },
      { key: 'b', text: 'Para evitar aceptar objetos que no se pueden usar.' },
      { key: 'c', text: 'Para clasificarlos según su valor histórico.' },
    ],
    correctAnswer: 'b',
    explanationKo:
      '기술팀의 검사는 센터가 쓸 수 없는 물건을 버리는 장소가 되는 것을 막았습니다. 즉 사용 불가능한 물품의 유입을 차단한다는 b가 맞습니다.',
    tags: ['원인결과', '추론'],
    ...review,
  },
  {
    id: 'r-lib-05',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t1-biblioteca-objetos',
    prompt: '¿Cómo respondió el Ayuntamiento a las dificultades del primer año?',
    options: [
      { key: 'a', text: 'Limitó el número de préstamos de cada socio.' },
      { key: 'b', text: 'Cerró el centro los días con más demanda.' },
      { key: 'c', text: 'Mejoró las reservas y amplió la atención.' },
    ],
    correctAnswer: 'c',
    explanationKo:
      '긴 줄 문제에 대해 온라인 예약을 만들고 자원봉사자의 도움으로 운영 시간을 늘렸습니다. 서비스를 축소한 것이 아니라 접근성을 개선했으므로 c입니다.',
    tags: ['문제해결', '세부정보'],
    ...review,
  },
  {
    id: 'r-lib-06',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t1-biblioteca-objetos',
    prompt: 'Según los organizadores, ¿qué demuestra especialmente el éxito del proyecto?',
    options: [
      { key: 'a', text: 'Que los talleres han favorecido nuevas relaciones vecinales.' },
      { key: 'b', text: 'Que ya no se compran herramientas en el municipio.' },
      { key: 'c', text: 'Que el catálogo contiene objetos de gran valor.' },
    ],
    correctAnswer: 'a',
    explanationKo:
      '마지막 문단은 대출 횟수만으로 성공을 판단하지 말아야 한다고 강조하며, 워크숍을 통해 이웃들이 다른 지역 프로젝트에서도 협력하게 된 변화를 제시합니다. 따라서 a입니다.',
    tags: ['주제', '추론', '공동체'],
    ...review,
  },

  // Lectura · Tarea 1 — Teletrabajar sin perder el pueblo
  {
    id: 'r-town-01',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t1-pueblos-teletrabajo',
    prompt: '¿Por qué desconfiaba el alcalde de algunas campañas de repoblación?',
    options: [
      { key: 'a', text: 'Porque temía una llegada poco duradera.' },
      { key: 'b', text: 'Porque rechazaba que los vecinos teletrabajaran.' },
      { key: 'c', text: 'Porque el pueblo no tenía viviendas vacías.' },
    ],
    correctAnswer: 'a',
    explanationKo:
      '시장은 많은 사람을 단기간에 끌어와 대부분이 여름 뒤 떠나는 방식, 즉 지속되지 않는 유입을 우려했습니다. 재택근무 자체를 반대한 것은 아닙니다.',
    tags: ['태도', '원인', '인구'],
    ...review,
  },
  {
    id: 'r-town-02',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t1-pueblos-teletrabajo',
    prompt: '¿Qué distinguía el programa de una oferta turística?',
    options: [
      { key: 'a', text: 'Las viviendas se ofrecían para periodos de varios meses.' },
      { key: 'b', text: 'Todos los participantes debían abrir una empresa.' },
      { key: 'c', text: 'El alojamiento era gratuito durante el verano.' },
    ],
    correctAnswer: 'a',
    explanationKo:
      '주말 관광 체류가 아니라 6개월 임대를 제공했다는 점이 핵심 차이입니다. 창업은 의무가 아니었고 무료 숙박이라는 내용도 없습니다.',
    tags: ['대조', '세부정보'],
    ...review,
  },
  {
    id: 'r-town-03',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t1-pueblos-teletrabajo',
    prompt: '¿Qué compromiso asumían las personas seleccionadas?',
    options: [
      { key: 'a', text: 'Trabajar para el Ayuntamiento.' },
      { key: 'b', text: 'Colaborar con alguna organización del pueblo.' },
      { key: 'c', text: 'Renunciar a su empleo a distancia.' },
    ],
    correctAnswer: 'b',
    explanationKo:
      '선발자는 지역 단체 한 곳에 참여해야 했습니다. 이는 공동체에 기여할 활동을 요구했다는 뜻이며 시청 근무나 원격근무 포기와는 관계없습니다.',
    tags: ['조건', '공동체'],
    ...review,
  },
  {
    id: 'r-town-04',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t1-pueblos-teletrabajo',
    prompt: '¿Qué hizo el Ayuntamiento ante el temor por el precio de los alquileres?',
    options: [
      { key: 'a', text: 'Canceló la selección de nuevos habitantes.' },
      { key: 'b', text: 'Prohibió alquilar viviendas privadas.' },
      { key: 'c', text: 'Protegió parte de la oferta local y explicó el proceso.' },
    ],
    correctAnswer: 'c',
    explanationKo:
      '시청은 재생 주택 일부를 기존 주민 가족에게 배정하고 선발 기준을 공개했습니다. 주거 공급 일부를 보호하고 절차를 투명하게 한 조치이므로 c입니다.',
    tags: ['문제해결', '바꿔쓰기', '주거'],
    ...review,
  },
  {
    id: 'r-town-05',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t1-pueblos-teletrabajo',
    prompt: '¿Qué resultado se menciona después de dos años?',
    options: [
      { key: 'a', text: 'La mayoría de los primeros participantes permanece allí.' },
      { key: 'b', text: 'El colegio ha vuelto a recibir alumnos.' },
      { key: 'c', text: 'Ya no es necesario viajar a la capital comarcal.' },
    ],
    correctAnswer: 'a',
    explanationKo:
      '최초 12명 중 9명이 남아 있으므로 다수가 정착했습니다. 학교는 재개교하지 않았고 행정 업무를 위해 여전히 이동해야 합니다.',
    tags: ['수치', '세부정보'],
    ...review,
  },
  {
    id: 'r-town-06',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t1-pueblos-teletrabajo',
    prompt: '¿Cuál es la conclusión del alcalde?',
    options: [
      { key: 'a', text: 'La conexión digital garantiza por sí sola el éxito.' },
      { key: 'b', text: 'Cada localidad debe adaptar el modelo a su realidad.' },
      { key: 'c', text: 'Los resultados solo son válidos si son espectaculares.' },
    ],
    correctAnswer: 'b',
    explanationKo:
      '시장은 다른 마을에 먼저 각자의 자원을 조사하라고 조언하며, 인터넷만으로 교통·주거·주민 수용성을 대신할 수 없다고 합니다. 지역 상황에 맞춘 접근이 필요하다는 b가 결론입니다.',
    tags: ['결론', '주장', '지역'],
    ...review,
  },

  // Lectura · Tarea 3 — Cuatro maneras de cambiar de profesión
  {
    id: 'r-career-01',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t3-cambio-profesional',
    prompt: '¿Quién mantuvo temporalmente su empleo anterior para reducir el riesgo?',
    options: [
      { key: 'a', text: 'Lucía' },
      { key: 'b', text: 'Omar' },
      { key: 'c', text: 'Elena' },
      { key: 'd', text: 'Tomás' },
    ],
    correctAnswer: 'a',
    explanationKo:
      'Lucía는 새 일의 수입이 충분한지 확인할 때까지 은행 일을 유지했다고 말합니다. 점진적 전환으로 위험과 불안을 줄인 사례입니다.',
    tags: ['정보매칭', '직업'],
    ...review,
  },
  {
    id: 'r-career-02',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t3-cambio-profesional',
    prompt: '¿Quién aprovechó una formación nueva sin abandonar del todo su antiguo sector?',
    options: [
      { key: 'a', text: 'Lucía' },
      { key: 'b', text: 'Omar' },
      { key: 'c', text: 'Elena' },
      { key: 'd', text: 'Tomás' },
    ],
    correctAnswer: 'b',
    explanationKo:
      'Omar는 프로그래밍 교육을 받은 뒤 다시 호텔업으로 돌아가 예약과 웹사이트를 관리합니다. 새 기술을 기존 업종에 결합했다는 점이 단서입니다.',
    tags: ['정보매칭', '전환'],
    ...review,
  },
  {
    id: 'r-career-03',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t3-cambio-profesional',
    prompt: '¿Quién descubrió que una característica vista negativamente podía ser útil?',
    options: [
      { key: 'a', text: 'Lucía' },
      { key: 'b', text: 'Omar' },
      { key: 'c', text: 'Elena' },
      { key: 'd', text: 'Tomás' },
    ],
    correctAnswer: 'c',
    explanationKo:
      '일부 기업이 Elena의 나이와 경력을 불리하게 보았지만 협동조합에서는 오랜 경험이 가장 큰 장점이 되었습니다. 부정적으로 평가된 특성이 강점으로 바뀐 사례입니다.',
    tags: ['정보매칭', '추론', '경력'],
    ...review,
  },
  {
    id: 'r-career-04',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t3-cambio-profesional',
    prompt: '¿Quién había calculado mal el trabajo indirecto de su nueva actividad?',
    options: [
      { key: 'a', text: 'Lucía' },
      { key: 'b', text: 'Omar' },
      { key: 'c', text: 'Elena' },
      { key: 'd', text: 'Tomás' },
    ],
    correctAnswer: 'd',
    explanationKo:
      'Tomás는 도구 비용은 계산했지만 청구서·공급업체·SNS에 들어가는 시간을 예상하지 못했습니다. 본업 외의 간접 업무를 과소평가한 사람은 Tomás입니다.',
    tags: ['정보매칭', '창업'],
    ...review,
  },

  // Lectura · Tarea 4 — El huerto que creció sobre el mercado
  {
    id: 'r-garden-01',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t4-huerto-azotea',
    prompt: 'La asociación hizo revisar el edificio ___ instalar las cajas de cultivo.',
    options: [
      { key: 'a', text: 'antes de' },
      { key: 'b', text: 'a pesar de' },
      { key: 'c', text: 'después de que' },
    ],
    correctAnswer: 'a',
    explanationKo:
      '구조 안전을 먼저 확인한 뒤 재배 상자를 설치했으므로 선후 관계를 나타내는 antes de가 필요합니다. 뒤에 원형동사 instalar가 오는 구조도 맞습니다.',
    tags: ['문법', '전치사', '시간관계'],
    ...review,
  },
  {
    id: 'r-garden-02',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t4-huerto-azotea',
    prompt: 'Cada puesto puede cultivar una parcela, ___ respete el calendario de riego.',
    options: [
      { key: 'a', text: 'ya que' },
      { key: 'b', text: 'siempre que' },
      { key: 'c', text: 'por eso' },
    ],
    correctAnswer: 'b',
    explanationKo:
      '공동 급수 일정을 지킨다는 조건 아래 재배할 수 있다는 뜻입니다. siempre que는 조건을 나타내며, 아직 충족 여부가 전제된 조건이므로 접속법 respete와 자연스럽게 결합합니다.',
    tags: ['문법', '접속법', '조건'],
    ...review,
  },
  {
    id: 'r-garden-03',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t4-huerto-azotea',
    prompt: 'Los productos se usan en talleres ___ venderse en el mercado.',
    options: [
      { key: 'a', text: 'en vez de' },
      { key: 'b', text: 'además de' },
      { key: 'c', text: 'a causa de' },
    ],
    correctAnswer: 'a',
    explanationKo:
      '수확물을 시장 상품으로 판매하지 않고 요리 수업이나 기부에 사용한다는 대조입니다. “~하는 대신”을 뜻하고 뒤에 부정사가 오는 en vez de가 정확합니다.',
    tags: ['문법', '연결어', '대조'],
    ...review,
  },
  {
    id: 'r-garden-04',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t4-huerto-azotea',
    prompt: 'Se publican los resultados ___ el huerto también funcione como laboratorio.',
    options: [
      { key: 'a', text: 'sin que' },
      { key: 'b', text: 'de modo que' },
      { key: 'c', text: 'a menos que' },
    ],
    correctAnswer: 'b',
    explanationKo:
      '연구 결과를 공개한 결과 옥상 텃밭이 실험실 역할도 하게 된다는 결과 관계입니다. de modo que가 “그 결과 ~하도록”의 의미를 만듭니다.',
    tags: ['문법', '연결어', '결과'],
    ...review,
  },
  {
    id: 'r-garden-05',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t4-huerto-azotea',
    prompt: '___ se sujetaran las plantas jóvenes, algunas no resistían el viento.',
    options: [
      { key: 'a', text: 'Por mucho que' },
      { key: 'b', text: 'Debido a que' },
      { key: 'c', text: 'En cuanto' },
    ],
    correctAnswer: 'a',
    explanationKo:
      '아무리 어린 식물을 고정해도 일부는 바람을 견디지 못했다는 양보 관계입니다. por mucho que + 접속법은 노력의 정도와 무관하게 결과가 달라지지 않음을 나타냅니다.',
    tags: ['문법', '접속법', '양보'],
    ...review,
  },

  // Expresión e interacción escritas
  {
    id: 'w-neighborhood-noise',
    skill: 'writing',
    kind: 'open',
    task: 'tarea1',
    prompt:
      '최근 지역 라디오에서 야간 소음 문제에 관한 인터뷰를 들었습니다. 시청 시민참여과에 150~180단어의 이메일을 쓰세요. 문제의 영향을 요약하고, 본인의 경험을 설명하며, 현실적인 해결책 두 가지와 시민이 참여할 방법을 제안하세요.',
    wordCount: [150, 180],
    timeLimitMin: 40,
    checklistKo: [
      '받는 사람과 글의 목적을 첫 문단에서 명확히 밝혔다.',
      '인터뷰의 핵심 문제를 그대로 베끼지 않고 요약했다.',
      '개인 경험 또는 관찰을 구체적인 예로 뒷받침했다.',
      '해결책 두 가지와 기대 효과를 논리적으로 연결했다.',
      '격식 있는 인사말·요청 표현·맺음말을 사용했다.',
    ],
    modelOutlineKo:
      '제목과 인사 → 연락 목적 및 인터뷰 요약 → 생활에 미친 영향과 구체적 사례 → 야간 순찰/소음 중재 창구 등 해결책 두 가지 → 주민 회의 참여 의사와 답변 요청 → 격식 있는 맺음말.',
    tags: ['격식 이메일', '도시생활', '제안'],
    ...review,
  },
  {
    id: 'w-library-hours',
    skill: 'writing',
    kind: 'open',
    task: 'tarea1',
    prompt:
      '대학교 도서관 운영시간을 시험 기간에 연장할지에 관한 학생회 팟캐스트를 들었습니다. 학생회에 150~180단어의 글을 보내세요. 찬반 의견을 비교하고, 본인의 입장과 조건을 설명하며, 이용자와 직원 모두를 고려한 대안을 제안하세요.',
    wordCount: [150, 180],
    timeLimitMin: 40,
    checklistKo: [
      '논의의 쟁점을 정확히 소개했다.',
      '서로 다른 관점의 장단점을 최소 하나씩 언급했다.',
      '자신의 입장을 근거와 사례로 설명했다.',
      '직원 노동조건과 학생 수요를 함께 고려했다.',
      '대조·원인·결과 연결어를 다양하게 사용했다.',
    ],
    modelOutlineKo:
      '주제 소개 → 연장 운영의 학습상 이점 → 비용·안전·직원 부담이라는 반대 근거 → 조건부 찬성 입장 → 좌석 예약, 일부 층만 연장, 수요 조사 등 절충안 → 결론.',
    tags: ['의견문', '교육', '대안'],
    ...review,
  },
  {
    id: 'w-local-market-article',
    skill: 'writing',
    kind: 'open',
    task: 'tarea2',
    prompt:
      '지역 잡지의 “우리 동네를 바꾼 장소” 특집에 150~180단어의 기사를 쓰세요. 한 장소가 과거와 현재에 어떻게 달라졌는지 묘사하고, 변화가 주민에게 미친 영향을 평가하며, 앞으로 개선할 점을 제안하세요.',
    wordCount: [150, 180],
    timeLimitMin: 40,
    checklistKo: [
      '독자의 관심을 끄는 제목과 도입부를 썼다.',
      '과거와 현재의 모습을 시간 표현으로 분명히 구분했다.',
      '변화의 긍정적·부정적 영향을 균형 있게 평가했다.',
      '장소를 떠올릴 수 있는 구체적 묘사를 포함했다.',
      '기사에 어울리는 친근하지만 정돈된 문체를 유지했다.',
    ],
    modelOutlineKo:
      '인상적인 제목 → 장소와 개인적 연결 소개 → 과거 모습 → 변화 과정과 현재 모습 → 주민 생활에 미친 두 가지 영향 → 보존하거나 개선할 점 → 기억에 남는 마무리.',
    tags: ['기사', '지역사회', '묘사'],
    ...review,
  },
  {
    id: 'w-digital-detox-blog',
    skill: 'writing',
    kind: 'open',
    task: 'tarea2',
    prompt:
      '스페인어 학습 블로그에 “일주일 동안 알림을 꺼 본 경험”이라는 150~180단어의 글을 쓰세요. 시도한 이유와 방법, 예상 밖의 어려움, 얻은 변화, 다른 사람에게 권할 조건을 포함하세요.',
    wordCount: [150, 180],
    timeLimitMin: 40,
    checklistKo: [
      '경험을 시간 순서에 따라 이해하기 쉽게 전개했다.',
      '시도 전의 기대와 실제 결과를 대조했다.',
      '감정과 행동의 변화를 구체적으로 표현했다.',
      '모든 사람에게 무조건 권하지 않고 조건을 제시했다.',
      '과거시제와 평가 표현을 적절히 사용했다.',
    ],
    modelOutlineKo:
      '호기심을 끄는 도입 → 알림을 끈 계기와 규칙 → 첫날의 불편 → 집중·관계에서 나타난 예상 밖의 변화 → 한계와 예외 → 독자에게 제안할 현실적인 방법.',
    tags: ['블로그', '경험담', '디지털 습관'],
    ...review,
  },

  // Expresión e interacción orales
  {
    id: 's-public-space',
    skill: 'speaking',
    kind: 'oral',
    task: 'tarea1',
    prompt:
      '“도심의 자동차 통행을 주말마다 제한해야 한다”는 제안에 대해 발표하세요. 제안의 장점과 예상되는 문제를 설명하고, 누구에게 어떤 영향이 있는지 비교한 뒤 본인의 결론과 보완책을 말하세요.',
    prepTimeMin: 5,
    speakTimeMin: 4,
    checklistKo: [
      '도입에서 주제와 발표 순서를 예고했다.',
      '환경·상권·이동권 등 두 가지 이상의 관점을 다뤘다.',
      '주장을 이유와 구체적인 예로 뒷받침했다.',
      '반대 의견을 인정한 뒤 보완책을 제시했다.',
      '결론에서 입장을 간결하게 다시 밝혔다.',
    ],
    modelOutlineKo:
      '주제 재진술 → 소음·공기질·보행 공간의 장점 → 거동 불편자·배달·상인의 우려 → 대중교통 증편과 허가 차량 같은 보완책 → 시범 운영 후 평가하자는 조건부 찬성 결론.',
    tags: ['발표', '도시', '찬반'],
    ...review,
  },
  {
    id: 's-photo-community',
    skill: 'speaking',
    kind: 'oral',
    task: 'tarea2',
    prompt:
      '공동 식탁에서 서로 다른 세대의 사람들이 음식을 준비하는 사진을 상상하세요. 보이는 장면과 사람들의 관계를 묘사하고, 이 모임 전후에 무슨 일이 있었을지 추측하며, 세대 간 활동의 가치에 관해 말하세요.',
    prepTimeMin: 3,
    speakTimeMin: 3,
    checklistKo: [
      '장소·인물·행동을 체계적인 순서로 묘사했다.',
      '확실히 보이는 정보와 추측을 표현으로 구분했다.',
      '과거와 이후 상황을 자연스럽게 상상했다.',
      '사진의 주제를 개인 또는 사회적 경험과 연결했다.',
      '공간·위치·감정을 나타내는 어휘를 다양하게 사용했다.',
    ],
    modelOutlineKo:
      '전체 장면 → 앞쪽과 뒤쪽 인물의 행동 → 표정과 관계 추측 → 모임을 준비한 과정과 이후 식사 예상 → 세대 간 지식 교환의 장점 → 비슷한 경험 또는 참여 의향.',
    tags: ['사진 묘사', '추측', '세대'],
    ...review,
  },
  {
    id: 's-survey-workplace',
    skill: 'speaking',
    kind: 'oral',
    task: 'tarea3',
    prompt:
      '직장 만족도 조사 결과를 두고 면접관과 대화한다고 가정하세요. 응답자의 62%는 유연 근무를 가장 중시하고, 48%는 교육 기회가 부족하다고 답했으며, 35%는 급여보다 팀 분위기를 우선했습니다. 눈에 띄는 결과를 설명하고 원인을 추측한 뒤 개선 우선순위를 협의하세요.',
    prepTimeMin: 2,
    speakTimeMin: 4,
    checklistKo: [
      '수치를 단순히 나열하지 않고 비교·해석했다.',
      '원인을 단정하지 않고 가능성 표현으로 제시했다.',
      '상대의 의견을 묻거나 확인하는 표현을 사용했다.',
      '우선순위에 동의하거나 이견을 조정했다.',
      '실행 가능한 개선안과 평가 방법을 제안했다.',
    ],
    modelOutlineKo:
      '가장 높은 수치와 의외의 결과 비교 → 유연 근무 선호 원인 추측 → 교육 부족이 장기적으로 미칠 영향 → 면접관에게 우선순위 질문 → 단기 유연근무 지침과 중기 교육 예산을 조합 → 재조사 제안.',
    tags: ['상호작용', '자료 해석', '직장'],
    ...review,
  },
] satisfies PracticeItem[];
