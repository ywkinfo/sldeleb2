import type { PracticeItem } from '../lib/types';

const review = {
  status: 'published' as const,
  reviewedBy: 'Spanish Lab · 스페인어 연구소',
  reviewedAt: '2026-07-11',
};

const listeningExpansionReview = {
  status: 'published' as const,
  reviewedBy: 'Spanish Lab · 스페인어 연구소',
  reviewedAt: '2026-07-12',
};

// 쓰기·말하기 스페인어 모범답안(modelAnswerEs) 추가와 함께 검수한 항목의 이력.
const modelAnswerReview = {
  status: 'published' as const,
  reviewedBy: 'Spanish Lab · 스페인어 연구소',
  reviewedAt: '2026-07-14',
};

// 읽기 모의고사(exam-reading-b2)용 신규 문항의 검수 이력.
const examReadingReview = {
  status: 'published' as const,
  reviewedBy: 'Spanish Lab · 스페인어 연구소',
  reviewedAt: '2026-07-15',
};

// Tarea 2 매칭: 네 인물이 공통 선택지다.
const anioFueraOptions = [
  { key: 'a', text: 'Marta' },
  { key: 'b', text: 'Diego' },
  { key: 'c', text: 'Lucía' },
  { key: 'd', text: 'Andrés' },
];

// Tarea 3 문장 삽입: 8개 조각이 공통 선택지(b·h는 오답 함정).
const semanaCuatroFragments = [
  { key: 'a', text: 'Pensemos en la sanidad o en la industria, donde la atención no puede detenerse en ningún momento.' },
  { key: 'b', text: 'El teletrabajo, en cambio, se ha extendido con rapidez desde la pandemia en casi toda Europa.' },
  { key: 'c', text: 'Quienes lo prueban sostienen que trabajar menos horas no reduce necesariamente lo que se produce.' },
  { key: 'd', text: 'Reducir la jornada sirve de poco si después se mantienen las mismas reuniones interminables.' },
  { key: 'e', text: 'Temen que algunas empresas exijan la misma carga de trabajo concentrada en menos días.' },
  { key: 'f', text: 'Al contrario, en varias oficinas los indicadores subieron durante los meses del experimento.' },
  { key: 'g', text: 'Por tanto, el reto real consiste en rediseñar los métodos de trabajo, no solo en recortar horas.' },
  { key: 'h', text: 'Los sindicatos llevan años reclamando un aumento general de los salarios mínimos en el continente.' },
];

const listeningT2SpeakerOptions = [
  { key: 'a', text: 'El hombre' },
  { key: 'b', text: 'La mujer' },
  { key: 'c', text: 'Ninguno de los dos' },
];

const listeningT4SpeakerOptions = [
  { key: 'a', text: 'Carlos' },
  { key: 'b', text: 'Lucía' },
  { key: 'c', text: 'Marcos' },
  { key: 'd', text: 'Elena' },
];

// Tarea 2 공유 선택지 은행: 6개 빈칸에 공통으로 제시되는 8개 문장 조각(2개는 어디에도 맞지 않는 오답)
const cineGapOptions = [
  {
    key: 'a',
    text: 'Una revisión técnica detectó fallos en la instalación eléctrica y accesos poco adecuados para personas con movilidad reducida.',
  },
  {
    key: 'b',
    text: 'Por esa razón, la cooperativa decidió traspasar el edificio a una gran cadena de multicines.',
  },
  {
    key: 'c',
    text: 'Sin embargo, un grupo de espectadores habituales se reunió esa misma tarde para buscar la manera de evitarlo.',
  },
  {
    key: 'd',
    text: 'De hecho, asociaciones de otras ciudades ya han visitado la sala para preguntar cómo se organizó todo el proceso.',
  },
  {
    key: 'e',
    text: 'En pocos meses, más de ochocientos vecinos aportaron pequeñas cantidades a cambio de ventajas simbólicas.',
  },
  {
    key: 'f',
    text: 'Además, la mayoría de los socios exigía programar únicamente los estrenos más comerciales.',
  },
  {
    key: 'g',
    text: 'En su opinión, la sala debe funcionar también como un punto de encuentro entre generaciones.',
  },
  {
    key: 'h',
    text: 'Esa oferta atrae tanto a los aficionados veteranos como a familias que buscan planes asequibles.',
  },
];

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

  // Lectura · Tarea 2 — El cine que salvaron los vecinos (문장 삽입형, 선택지 A–H 공유)
  {
    id: 'r-cine-01',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t2-cine-barrio',
    prompt: 'Hueco [ 1 ]: ¿qué fragmento completa el texto?',
    options: cineGapOptions,
    correctAnswer: 'c',
    explanationKo:
      '앞은 폐관 발표에 아무도 놀라지 않았다는 체념의 분위기이고, 바로 뒤에서 "aquella reunión improvisada"(그 즉석 모임)가 협동조합의 기원이었다고 말합니다. 빈칸에서 먼저 모임이 언급되어야 하므로, 단골 관객들이 그날 오후에 모였다는 c가 정답입니다. Sin embargo가 체념과 행동 사이의 대조도 만들어 줍니다.',
    tags: ['문장삽입', '결속성', '지시어'],
    ...review,
  },
  {
    id: 'r-cine-02',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t2-cine-barrio',
    prompt: 'Hueco [ 2 ]: ¿qué fragmento completa el texto?',
    options: cineGapOptions,
    correctAnswer: 'e',
    explanationKo:
      '뒤 문장의 "Con esa base"(그 기반 위에서)가 가리킬 구체적 성과가 빈칸에 있어야 합니다. 800명이 넘는 주민이 소액을 출자했다는 e가 협동조합 은행이 나머지를 융자해 준 근거가 됩니다.',
    tags: ['문장삽입', '지시어', '재정'],
    ...review,
  },
  {
    id: 'r-cine-03',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t2-cine-barrio',
    prompt: 'Hueco [ 3 ]: ¿qué fragmento completa el texto?',
    options: cineGapOptions,
    correctAnswer: 'h',
    explanationKo:
      '앞은 새 프로그램 편성(테마 상영, 원어 상영, 학교 대상 오전 상영)이고, 뒤의 "ese equilibrio entre públicos"(그 관객층 간 균형)가 핵심 단서입니다. 노장년 애호가와 가족 관객을 모두 끌어들인다는 h가 "균형"의 내용을 채워 줍니다. 상업 개봉작만 요구했다는 f는 편성 방향과 정면으로 모순됩니다.',
    tags: ['문장삽입', '결속성', '문화'],
    ...review,
  },
  {
    id: 'r-cine-04',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t2-cine-barrio',
    prompt: 'Hueco [ 4 ]: ¿qué fragmento completa el texto?',
    options: cineGapOptions,
    correctAnswer: 'a',
    explanationKo:
      '앞에서 미룰 수 없는 보수 공사가 필요했다고 했고, 뒤에서는 공사를 단계별로 진행했다고 이어집니다. 어떤 결함이 발견되었는지 구체화하는 문장이 필요하므로 전기 설비 결함과 접근성 문제를 언급한 a가 정답입니다.',
    tags: ['문장삽입', '세부정보'],
    ...review,
  },
  {
    id: 'r-cine-05',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t2-cine-barrio',
    prompt: 'Hueco [ 5 ]: ¿qué fragmento completa el texto?',
    options: cineGapOptions,
    correctAnswer: 'g',
    explanationKo:
      '앞의 "no es únicamente cultural"(문화 사업만은 아니다)과 뒤의 "Por eso"(그래서) 사이에는 사회적 역할에 대한 주장이 들어가야 합니다. 극장이 세대 간 만남의 장이 되어야 한다는 g가 지역 예술가 전시와 할인 요금 정책의 이유를 제공합니다.',
    tags: ['문장삽입', '주장', '공동체'],
    ...review,
  },
  {
    id: 'r-cine-06',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t2-cine-barrio',
    prompt: 'Hueco [ 6 ]: ¿qué fragmento completa el texto?',
    options: cineGapOptions,
    correctAnswer: 'd',
    explanationKo:
      '앞은 이 모델이 동네 밖에서 관심을 끌기 시작했다는 내용이고, 뒤의 "responden siempre lo mismo"(늘 같은 대답을 한다)는 누군가의 질문을 전제합니다. 다른 도시의 단체들이 찾아와 과정을 물었다는 d가 두 문장을 자연스럽게 잇습니다. 건물을 대형 체인에 넘겼다는 b는 글 전체와 모순되어 어느 빈칸에도 맞지 않습니다.',
    tags: ['문장삽입', '추론'],
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

  // Lectura · Tarea 3 — Cuatro maneras de aprender un idioma
  {
    id: 'r-idiomas-01',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t3-aprender-idiomas',
    prompt: '¿Quién comprobó que vivir en el extranjero no bastaba por sí solo para progresar?',
    options: [
      { key: 'a', text: 'David' },
      { key: 'b', text: 'Noelia' },
      { key: 'c', text: 'Raquel' },
      { key: 'd', text: 'Iván' },
    ],
    correctAnswer: 'a',
    explanationKo:
      'David는 더블린에 살면 영어가 저절로 늘 것이라 믿었지만 같은 실수를 반복했고, 결국 야간 수업에 등록했습니다. "la inmersión, sin estudio, se queda a medias"(공부 없는 몰입은 절반에 그친다)가 결정적 단서입니다.',
    tags: ['정보매칭', '언어학습'],
    ...review,
  },
  {
    id: 'r-idiomas-02',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t3-aprender-idiomas',
    prompt: '¿Quién puso normas para que sus conversaciones fueran productivas?',
    options: [
      { key: 'a', text: 'David' },
      { key: 'b', text: 'Noelia' },
      { key: 'c', text: 'Raquel' },
      { key: 'd', text: 'Iván' },
    ],
    correctAnswer: 'b',
    explanationKo:
      'Noelia는 언어 교환 초기의 혼란스러운 대화에 규칙(언어별 30분, 공유 교정 목록)을 도입했고, "sin esas reglas, habríamos abandonado"라고 말합니다. 규칙 덕분에 대화가 유지되었다는 사람은 Noelia입니다.',
    tags: ['정보매칭', '학습전략'],
    ...review,
  },
  {
    id: 'r-idiomas-03',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t3-aprender-idiomas',
    prompt: '¿Quién buscó enseñanza con correcciones tras estancarse estudiando por su cuenta?',
    options: [
      { key: 'a', text: 'David' },
      { key: 'b', text: 'Noelia' },
      { key: 'c', text: 'Raquel' },
      { key: 'd', text: 'Iván' },
    ],
    correctAnswer: 'c',
    explanationKo:
      'Raquel은 앱으로 독학하다 발전 없이 같은 연습만 반복하는 정체기를 겪었고, 정규 어학원에 등록해 교사의 교정으로 스스로 몰랐던 나쁜 습관을 고쳤습니다. 독학의 한계 → 교정이 있는 수업이라는 흐름이 단서입니다.',
    tags: ['정보매칭', '피드백'],
    ...review,
  },
  {
    id: 'r-idiomas-04',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t3-aprender-idiomas',
    prompt: '¿Quién reforzó una destreza que había descuidado durante años?',
    options: [
      { key: 'a', text: 'David' },
      { key: 'b', text: 'Noelia' },
      { key: 'c', text: 'Raquel' },
      { key: 'd', text: 'Iván' },
    ],
    correctAnswer: 'd',
    explanationKo:
      'Iván은 드라마·팟캐스트·포럼으로 어휘는 풍부해졌지만 한 번도 연습하지 않은 쓰기가 약점이었고, 온라인 글쓰기 워크숍에 등록해 보완했습니다. 방치했던 기능 하나를 특정 활동으로 보강한 사례입니다.',
    tags: ['정보매칭', '쓰기'],
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

  // Lectura · Tarea 4 — Un club de lectura dentro del hospital
  {
    id: 'r-hospital-01',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t4-club-lectura',
    prompt: 'La coordinadora defendió el proyecto ___ la lectura compartida había dado buenos resultados.',
    options: [
      { key: 'a', text: 'puesto que' },
      { key: 'b', text: 'a fin de que' },
      { key: 'c', text: 'a no ser que' },
    ],
    correctAnswer: 'a',
    explanationKo:
      '이미 확인된 사실(다른 센터에서의 성과)을 근거로 제시하므로 이유를 나타내는 puesto que가 필요하며, 뒤에 직설법 había dado가 오는 것과도 일치합니다. a fin de que(목적)와 a no ser que(예외 조건)는 접속법을 요구해 문장과 맞지 않습니다.',
    tags: ['문법', '연결어', '이유'],
    ...review,
  },
  {
    id: 'r-hospital-02',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t4-club-lectura',
    prompt: 'Los participantes pueden incorporarse en cualquier momento, ___ el personal sanitario recomiende lo contrario.',
    options: [
      { key: 'a', text: 'puesto que' },
      { key: 'b', text: 'a no ser que' },
      { key: 'c', text: 'de modo que' },
    ],
    correctAnswer: 'b',
    explanationKo:
      '언제든 참여할 수 있지만 의료진이 반대할 경우는 예외라는 뜻입니다. "~하지 않는 한"의 예외 조건을 나타내는 a no ser que가 정답이며, 아직 실현되지 않은 가정이므로 접속법 recomiende와 결합합니다.',
    tags: ['문법', '접속법', '예외조건'],
    ...review,
  },
  {
    id: 'r-hospital-03',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t4-club-lectura',
    prompt: 'Las sesiones se celebran por la tarde, ___ las mañanas se reservan para las pruebas médicas.',
    options: [
      { key: 'a', text: 'para que' },
      { key: 'b', text: 'a medida que' },
      { key: 'c', text: 'mientras que' },
    ],
    correctAnswer: 'c',
    explanationKo:
      '오후(모임)와 오전(검사)이라는 두 시간대의 용도를 맞세우는 대조 관계입니다. mientras que는 "~인 반면"으로 대조를 나타냅니다. para que는 목적, a medida que는 점진적 변화를 나타내 어색합니다.',
    tags: ['문법', '연결어', '대조'],
    ...review,
  },
  {
    id: 'r-hospital-04',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t4-club-lectura',
    prompt: 'Pueden leer en voz alta ___ respeten el ritmo de cada paciente.',
    options: [
      { key: 'a', text: 'con tal de que' },
      { key: 'b', text: 'en cuanto' },
      { key: 'c', text: 'dado que' },
    ],
    correctAnswer: 'a',
    explanationKo:
      '환자의 속도를 존중한다는 조건을 지키면 낭독이 허용된다는 뜻이므로 "~하기만 하면"의 con tal de que가 정답이며 접속법 respeten과 결합합니다. en cuanto는 "~하자마자", dado que는 이유로 조건의 의미가 없습니다.',
    tags: ['문법', '접속법', '조건'],
    ...review,
  },
  {
    id: 'r-hospital-05',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t4-club-lectura',
    prompt: '___ algunos participantes no terminan los libros, los organizadores consideran que el club cumple su función.',
    options: [
      { key: 'a', text: 'A medida que' },
      { key: 'b', text: 'Aun cuando' },
      { key: 'c', text: 'Con tal de que' },
    ],
    correctAnswer: 'b',
    explanationKo:
      '책을 다 읽지 못하는 참가자가 있어도 클럽이 제 역할을 한다는 양보 관계입니다. Aun cuando는 "비록 ~일지라도"를 뜻합니다. A medida que(점진), Con tal de que(조건)는 앞뒤 논리와 맞지 않습니다.',
    tags: ['문법', '연결어', '양보'],
    ...review,
  },

  // Audición · Tarea 3 — Entrevista a una investigadora del sueño
  {
    id: 'l-sueno-01',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t3-entrevista-sueno',
    prompt: '¿Qué resultado sorprendió al equipo de la doctora?',
    options: [
      { key: 'a', text: 'Que los adolescentes duermen menos de lo recomendado.' },
      { key: 'b', text: 'Que el desajuste entre semana y fin de semana empeora el descanso.' },
      { key: 'c', text: 'Que los adolescentes han dejado de hacer siestas.' },
    ],
    correctAnswer: 'b',
    explanationKo:
      '적게 잔다는 사실은 "eso ya lo sabíamos"(이미 알고 있었다)라고 말합니다. 놀라웠던 것은 주중과 주말의 수면 차이가 체내 시계를 더 흐트러뜨린다는 점이므로 b입니다.',
    tags: ['세부정보', '듣기', '건강'],
    ...review,
  },
  {
    id: 'l-sueno-02',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t3-entrevista-sueno',
    prompt: 'Según la doctora, recuperar sueño el fin de semana…',
    options: [
      { key: 'a', text: 'es siempre perjudicial para el reloj interno.' },
      { key: 'b', text: 'es aceptable si la diferencia no es demasiado grande.' },
      { key: 'c', text: 'solo funciona si se duerme hasta mediodía.' },
    ],
    correctAnswer: 'b',
    explanationKo:
      '한두 시간 보충은 해가 없고(no hace daño), 세 시간을 넘길 때 문제가 생긴다고 합니다. 한도 안에서는 괜찮다는 b가 정답입니다. a는 "항상 해롭다"로 과장된 진술입니다.',
    tags: ['조건', '듣기', '수치'],
    ...review,
  },
  {
    id: 'l-sueno-03',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t3-entrevista-sueno',
    prompt: 'Sobre las pantallas, la doctora afirma que…',
    options: [
      { key: 'a', text: 'la luz es la causa principal del retraso del sueño.' },
      { key: 'b', text: 'los contenidos retrasan el sueño más que el brillo.' },
      { key: 'c', text: 'los juegos afectan menos que los vídeos.' },
    ],
    correctAnswer: 'b',
    explanationKo:
      '통설(빛 때문)을 부정하며 "no es el brillo…, sino el contenido"라고 대조합니다. 계속 보게 설계된 콘텐츠가 문제라는 b가 정답입니다.',
    tags: ['대조', '듣기', '디지털'],
    ...review,
  },
  {
    id: 'l-sueno-04',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t3-entrevista-sueno',
    prompt: '¿Qué aconseja la doctora a las familias?',
    options: [
      { key: 'a', text: 'Prohibir los dispositivos por la noche.' },
      { key: 'b', text: 'Trasladar el estudio al dormitorio.' },
      { key: 'c', text: 'Acordar las normas junto con los adolescentes.' },
    ],
    correctAnswer: 'c',
    explanationKo:
      '"Más que prohibir, aconsejo acordar un horario con los propios adolescentes" — 금지보다 합의를 권합니다. 함께 정한 규칙이 더 오래 지켜진다는 이유도 덧붙이므로 c입니다.',
    tags: ['조언', '듣기', '가족'],
    ...review,
  },
  {
    id: 'l-sueno-05',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t3-entrevista-sueno',
    prompt: 'Según la entrevista, una siesta de unos veinte minutos…',
    options: [
      { key: 'a', text: 'favorece la atención por la tarde.' },
      { key: 'b', text: 'roba horas al sueño nocturno.' },
      { key: 'c', text: 'sustituye el sueño de la noche.' },
    ],
    correctAnswer: 'a',
    explanationKo:
      '짧은 낮잠은 오후 집중력을 높이고(mejora la atención), 밤잠을 빼앗는 것은 긴 낮잠(las siestas largas, en cambio)입니다. 대조 표현 en cambio를 놓치지 않는 것이 관건입니다.',
    tags: ['대조', '듣기', '습관'],
    ...review,
  },
  {
    id: 'l-sueno-06',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t3-entrevista-sueno',
    prompt: 'Al final de la entrevista, la periodista…',
    options: [
      { key: 'a', text: 'pide a la doctora un resumen del estudio.' },
      { key: 'b', text: 'anuncia que volverá a invitarla más adelante.' },
      { key: 'c', text: 'se despide sin planes de otro encuentro.' },
    ],
    correctAnswer: 'b',
    explanationKo:
      '기자는 연구의 다음 단계가 발표되면 다시 초대하겠다고 말하며 마무리합니다(Volveremos a invitarla). 재초대 계획이 명시되므로 b입니다.',
    tags: ['화자의도', '듣기'],
    ...review,
  },

  // Audición · Tarea 5 — Charla: el desperdicio de alimentos en casa
  {
    id: 'l-comida-01',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t5-desperdicio-alimentos',
    prompt: 'Según la conferenciante, la mayor parte del desperdicio se produce…',
    options: [
      { key: 'a', text: 'en los supermercados.' },
      { key: 'b', text: 'en los restaurantes.' },
      { key: 'c', text: 'en los hogares.' },
    ],
    correctAnswer: 'c',
    explanationKo:
      '흔히 슈퍼마켓과 식당을 탓하지만(solemos culpar…) 유럽 연구들은 절반 이상이 가정에서 발생한다는 데 일치한다고 합니다. 통념과 사실의 대비를 듣는 문제입니다.',
    tags: ['세부정보', '듣기', '환경'],
    ...review,
  },
  {
    id: 'l-comida-02',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t5-desperdicio-alimentos',
    prompt: 'La primera causa del desperdicio que menciona es…',
    options: [
      { key: 'a', text: 'comprar sin planificar.' },
      { key: 'b', text: 'el tamaño insuficiente de las neveras.' },
      { key: 'c', text: 'el precio bajo de los alimentos.' },
    ],
    correctAnswer: 'a',
    explanationKo:
      '첫 번째 이유는 계획의 부재("la planificación, o mejor dicho, su ausencia")입니다. 목록 없이 사고 불필요한 할인 상품을 사는 행동이 예시로 이어지므로 a입니다.',
    tags: ['원인', '듣기', '소비'],
    ...review,
  },
  {
    id: 'l-comida-03',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t5-desperdicio-alimentos',
    prompt: 'La fecha de consumo preferente indica que el producto…',
    options: [
      { key: 'a', text: 'supone un riesgo para la salud.' },
      { key: 'b', text: 'puede perder sabor o textura.' },
      { key: 'c', text: 'debe tirarse de inmediato.' },
    ],
    correctAnswer: 'b',
    explanationKo:
      '건강상 위험을 나타내는 것은 fecha de caducidad(유통기한)이고, consumo preferente(품질유지기한)는 맛과 질감이 떨어질 수 있음을 알릴 뿐입니다. 두 라벨의 구분이 핵심입니다.',
    tags: ['용어구분', '듣기'],
    ...review,
  },
  {
    id: 'l-comida-04',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t5-desperdicio-alimentos',
    prompt: '¿Qué recomienda sobre la colocación de los alimentos?',
    options: [
      { key: 'a', text: 'Guardar las ofertas al fondo de la nevera.' },
      { key: 'b', text: 'Poner a la vista lo que caduca antes.' },
      { key: 'c', text: 'Ordenarlos por tipo de producto.' },
    ],
    correctAnswer: 'b',
    explanationKo:
      '두 번째 제안은 먼저 상하는 식품을 눈에 띄게 앞에 두라는 것입니다. "lo que no se ve, no se come"(안 보이면 안 먹는다)가 근거 문장입니다.',
    tags: ['조언', '듣기'],
    ...review,
  },
  {
    id: 'l-comida-05',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t5-desperdicio-alimentos',
    prompt: 'Sobre la congelación, la conferenciante afirma que…',
    options: [
      { key: 'a', text: 'muchos platos cocinados la soportan bien.' },
      { key: 'b', text: 'solo es adecuada para el pan.' },
      { key: 'c', text: 'cambia el sabor de forma peligrosa.' },
    ],
    correctAnswer: 'a',
    explanationKo:
      '빵과 치즈뿐 아니라 조리된 음식도(incluso muchos platos cocinados) 냉동고에서 몇 주를 견딘다고 합니다. 냉동에 대한 두려움을 버리라는 취지이므로 a입니다.',
    tags: ['세부정보', '듣기'],
    ...review,
  },
  {
    id: 'l-comida-06',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t5-desperdicio-alimentos',
    prompt: 'El mensaje final de la charla es que…',
    options: [
      { key: 'a', text: 'reducir el desperdicio exige sacrificios importantes.' },
      { key: 'b', text: 'los pequeños hábitos repetidos son suficientes.' },
      { key: 'c', text: 'salvar una bolsa a la semana no merece la pena.' },
    ],
    correctAnswer: 'b',
    explanationKo:
      '"no exige grandes sacrificios, sino pequeños hábitos repetidos" — 큰 희생이 아니라 반복되는 작은 습관이면 충분하다는 결론입니다. c는 마지막 문장의 의미를 뒤집은 오답입니다.',
    tags: ['결론', '듣기'],
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
    modelAnswerEs: `Asunto: Propuestas para reducir el ruido nocturno en el barrio

Estimados señores del Área de Participación Ciudadana:

Les escribo tras escuchar la entrevista de la radio local sobre el ruido nocturno, un problema que afecta seriamente a nuestro barrio. Desde hace meses, el ruido de las terrazas y los locales impide descansar a muchos vecinos, lo que provoca cansancio e irritabilidad. En mi caso, vivo cerca de la plaza mayor y apenas consigo dormir entre semana, de modo que mi rendimiento en el trabajo ha bajado notablemente.

Por ello, me gustaría proponer dos medidas realistas. En primer lugar, sería útil establecer un horario de cierre más estricto y reforzar las inspecciones nocturnas. En segundo lugar, podría crearse un buzón de quejas en línea para avisar rápidamente a la policía.

Además, los ciudadanos podríamos colaborar participando en una reunión vecinal mensual para acordar soluciones conjuntas. Quedo a la espera de su respuesta y les agradezco de antemano su atención.

Atentamente,
Un vecino preocupado`,
    tags: ['격식 이메일', '도시생활', '제안'],
    ...modelAnswerReview,
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
    modelAnswerEs: `Asunto: La ampliación del horario de la biblioteca en época de exámenes

Estimados miembros del consejo de estudiantes:

He escuchado vuestro pódcast sobre la posible ampliación del horario de la biblioteca durante los exámenes y me gustaría dar mi opinión. Por un lado, abrir hasta más tarde beneficiaría a quienes trabajan por la mañana o se concentran mejor de noche, ya que dispondrían de un espacio tranquilo. Por otro lado, entiendo que esta medida supone más gastos, problemas de seguridad y una carga adicional para el personal.

Personalmente, estoy a favor, pero solo bajo ciertas condiciones. Me parece razonable ampliar el horario únicamente durante las dos semanas de exámenes y en una sola planta, para reducir costes.

Como alternativa, propongo un sistema de reserva de asientos y la contratación de estudiantes becarios que se turnen con el personal fijo. Así se atenderían las necesidades de los usuarios sin sobrecargar a los trabajadores. Muchas gracias por escuchar nuestras propuestas.

Un saludo cordial`,
    tags: ['의견문', '교육', '대안'],
    ...modelAnswerReview,
  },

  // Audición · Tarea 1 — Aviso en la estación de tren
  {
    id: 'l-t1-estacion-01',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t1-anuncio-estacion',
    prompt: 'Según el aviso, ¿qué deben hacer los pasajeros del tren a Sevilla?',
    options: [
      { key: 'a', text: 'Esperar veinte minutos en la vía número seis.' },
      { key: 'b', text: 'Cambiar de vía debido a una avería.' },
      { key: 'c', text: 'Solicitar un nuevo billete en la taquilla.' },
    ],
    correctAnswer: 'b',
    explanationKo:
      '안내방송에서는 "deben dirigirse a la vía número cuatro en lugar de la vía número seis"라고 하여 6번 대신 4번 승강장으로 가라고 지시하고 있습니다. 플랫폼을 바꿔야 하므로 b가 정답입니다.',
    tags: ['장소안내', '듣기', '교통'],
    ...review,
  },
  {
    id: 'l-t1-reserva-restaurante-01',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t1-reserva-restaurante',
    prompt: '¿Qué acuerdan finalmente la clienta y el camarero?',
    options: [
      { key: 'a', text: 'La clienta llegará a la hora reservada con otra persona.' },
      { key: 'b', text: 'El restaurante guardará una mesa grande hasta las nueve y media.' },
      { key: 'c', text: 'Los cuatro clientes cenarán en una mesa más pequeña.' },
    ],
    correctAnswer: 'a',
    explanationKo:
      '손님은 예약 시간을 미루는 대신 “iremos puntuales y pediremos algo mientras esperamos”라고 답합니다. 두 사람이 먼저 제시간에 가서 친구들을 기다리기로 했으므로 a가 맞습니다.',
    tags: ['합의', '듣기', '외식'],
    ...listeningExpansionReview,
  },
  {
    id: 'l-t1-devolucion-biblioteca-01',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t1-devolucion-biblioteca',
    prompt: '¿Qué ventaja tendrá el usuario por el cierre de la biblioteca?',
    options: [
      { key: 'a', text: 'Podrá llevarse dos libros adicionales.' },
      { key: 'b', text: 'Dispondrá de más tiempo para devolver el préstamo.' },
      { key: 'c', text: 'Recibirá en casa la novela que busca.' },
    ],
    correctAnswer: 'b',
    explanationKo:
      '도서관 직원이 휴관 때문에 “tendrá diez días adicionales para devolverlo”라고 안내합니다. 반납 기간이 열흘 늘어나므로 b가 정답입니다.',
    tags: ['세부정보', '듣기', '도서관'],
    ...listeningExpansionReview,
  },
  {
    id: 'l-t1-bicicleta-vecina-01',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t1-bicicleta-vecina',
    prompt: '¿Por qué dejó Ana la bicicleta en el portal?',
    options: [
      { key: 'a', text: 'Porque el ascensor no llegaba hasta el trastero.' },
      { key: 'b', text: 'Porque esperaba que el técnico la reparara allí.' },
      { key: 'c', text: 'Porque no podía guardarla con seguridad en su lugar habitual.' },
    ],
    correctAnswer: 'c',
    explanationKo:
      'Ana는 “Se rompió la cerradura del cuarto de bicicletas”라서 도난을 피하려고 자전거를 올려 두었다고 설명합니다. 평소 보관 장소를 안전하게 쓸 수 없었으므로 c입니다.',
    tags: ['이유', '듣기', '주거'],
    ...listeningExpansionReview,
  },
  {
    id: 'l-t1-cambio-chaqueta-01',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t1-cambio-chaqueta',
    prompt: '¿Qué decide hacer el cliente?',
    options: [
      { key: 'a', text: 'Esperar a que llegue la chaqueta del mismo color.' },
      { key: 'b', text: 'Probarse el mismo modelo en otro color.' },
      { key: 'c', text: 'Devolver la chaqueta a la persona que se la regaló.' },
    ],
    correctAnswer: 'b',
    explanationKo:
      '원래 색상의 중간 사이즈는 목요일에 오지만, 손님은 “Prefiero probarme la azul”이라고 합니다. 같은 모델의 파란색을 입어 보기로 했으므로 b가 맞습니다.',
    tags: ['결정', '듣기', '쇼핑'],
    ...listeningExpansionReview,
  },
  {
    id: 'l-t1-cita-dentista-01',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t1-cita-dentista',
    prompt: '¿Cuándo atenderán finalmente al paciente?',
    options: [
      { key: 'a', text: 'Mañana a las diez.' },
      { key: 'b', text: 'Mañana a las doce.' },
      { key: 'c', text: 'El miércoles a las ocho y media.' },
    ],
    correctAnswer: 'c',
    explanationKo:
      '환자가 수요일 8시 30분에 갈 수 있다고 하자 접수원이 “Le cambio la cita al miércoles a esa hora”라고 확정합니다. 따라서 c가 정답입니다.',
    tags: ['시간확인', '듣기', '병원'],
    ...listeningExpansionReview,
  },

  // Audición · Tarea 2 — Preparativos para la fiesta del barrio
  {
    id: 'l-t2-fiesta-barrio-01',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t2-fiesta-barrio',
    prompt: '¿Quién dice que al principio no quería participar por la cantidad de asistentes?',
    options: listeningT2SpeakerOptions,
    correctAnswer: 'b',
    explanationKo:
      'Sofía는 처음에는 참여하고 싶지 않았고 “Pensaba que habría demasiada gente”라고 이유를 밝힙니다. 여자 화자의 말이므로 b입니다.',
    tags: ['화자판별', '듣기', '지역축제'],
    ...listeningExpansionReview,
  },
  {
    id: 'l-t2-fiesta-barrio-02',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t2-fiesta-barrio',
    prompt: '¿Quién dice que valora especialmente la oportunidad de conocer mejor a sus vecinos?',
    options: listeningT2SpeakerOptions,
    correctAnswer: 'a',
    explanationKo:
      'Diego는 콘서트보다 “conocer a vecinos”가 가장 좋다고 말합니다. 남자 화자가 이웃과 친해질 기회를 특히 중시하므로 a가 정답입니다.',
    tags: ['화자판별', '듣기', '이웃관계'],
    ...listeningExpansionReview,
  },
  {
    id: 'l-t2-fiesta-barrio-03',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t2-fiesta-barrio',
    prompt: '¿Quién dice que conviene preparar con antelación una lista de materiales?',
    options: listeningT2SpeakerOptions,
    correctAnswer: 'a',
    explanationKo:
      'Diego가 “prefiero preparar una lista esta misma semana”이라고 말하며 막판 준비로 불필요한 구매를 하는 일을 피하려 합니다. 따라서 a입니다.',
    tags: ['화자판별', '듣기', '준비'],
    ...listeningExpansionReview,
  },
  {
    id: 'l-t2-fiesta-barrio-04',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t2-fiesta-barrio',
    prompt: '¿Quién dice que quiere organizar una actividad infantil con objetos reutilizados?',
    options: listeningT2SpeakerOptions,
    correctAnswer: 'b',
    explanationKo:
      'Sofía가 아이들이 “construyan instrumentos con envases usados”라는 워크숍을 제안했다고 밝힙니다. 여자 화자의 제안이므로 b입니다.',
    tags: ['화자판별', '듣기', '재활용'],
    ...listeningExpansionReview,
  },
  {
    id: 'l-t2-fiesta-barrio-05',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t2-fiesta-barrio',
    prompt: '¿Quién dice que la fiesta debería anunciarse exclusivamente por las redes sociales?',
    options: listeningT2SpeakerOptions,
    correctAnswer: 'c',
    explanationKo:
      'Diego는 SNS 계정을 제안하지만 그것만 써야 한다고 말하지 않습니다. Sofía도 “no debería ser el único medio”라며 포스터와 인쇄물을 제안하므로 어느 쪽도 해당하지 않아 c입니다.',
    tags: ['화자판별', '듣기', '홍보'],
    ...listeningExpansionReview,
  },
  {
    id: 'l-t2-fiesta-barrio-06',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t2-fiesta-barrio',
    prompt: '¿Quién dice que los voluntarios más antiguos rechazaron las propuestas nuevas?',
    options: listeningT2SpeakerOptions,
    correctAnswer: 'c',
    explanationKo:
      'Sofía는 그런 반응을 걱정했지만 실제로는 “todos han sido bastante abiertos”라고 말합니다. Diego도 거부했다고 하지 않으므로 둘 다 아닌 c가 정답입니다.',
    tags: ['화자판별', '듣기', '협업'],
    ...listeningExpansionReview,
  },

  // Audición · Tarea 4 — Experiencias de aprendizaje de idiomas
  {
    id: 'l-t2-idiomas-01',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t2-experiencias-idiomas',
    prompt: 'Esta persona mejoró interactuando de forma relajada con hablantes de otras partes del mundo.',
    options: listeningT4SpeakerOptions,
    correctAnswer: 'a',
    explanationKo:
      'Carlos는 다른 나라 사람들과 비디오 게임을 하며 발전했다고 말합니다. “jugar a videojuegos con gente de otros países”와 “aprendí sin darme cuenta”가 편안한 상호작용의 직접 근거이므로 Carlos입니다.',
    tags: ['의견매칭', '듣기', '언어학습'],
    ...listeningExpansionReview,
  },
  {
    id: 'l-t2-idiomas-02',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t2-experiencias-idiomas',
    prompt: 'Esta persona considera indispensable conocer las reglas de la lengua antes de practicarla.',
    options: listeningT4SpeakerOptions,
    correctAnswer: 'c',
    explanationKo:
      'Marcos는 “Si no entiendo la gramática desde la base, me siento perdido”라고 하며 기초 문법과 구조를 먼저 알아야 한다고 말합니다. 따라서 Marcos가 정답입니다.',
    tags: ['의견매칭', '듣기', '언어학습'],
    ...listeningExpansionReview,
  },
  {
    id: 'l-t2-idiomas-03',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t2-experiencias-idiomas',
    prompt: 'Esta persona aprendió progresivamente al superar su inseguridad en las conversaciones.',
    options: listeningT4SpeakerOptions,
    correctAnswer: 'b',
    explanationKo:
      'Lucía는 “la clave es perder el miedo a hablar”라고 하고, 원어민과 계속 대화하며 “Poco a poco gané fluidez”라고 설명합니다. 불안을 극복하며 점차 배운 화자는 Lucía입니다.',
    tags: ['의견매칭', '듣기', '언어학습'],
    ...listeningExpansionReview,
  },
  {
    id: 'l-t2-idiomas-04',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t2-experiencias-idiomas',
    prompt: 'Esta persona combina los subtítulos con una segunda escucha sin apoyo escrito.',
    options: listeningT4SpeakerOptions,
    correctAnswer: 'd',
    explanationKo:
      'Elena는 “Primero veo cada episodio con subtítulos”라고 한 뒤 일부 장면을 자막 없이 다시 본다고 합니다. 두 방식을 결합하는 화자는 Elena입니다.',
    tags: ['의견매칭', '듣기', '영상학습'],
    ...listeningExpansionReview,
  },
  {
    id: 'l-t2-idiomas-05',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t2-experiencias-idiomas',
    prompt: 'Esta persona prefiere que no le señalen cada equivocación mientras habla.',
    options: listeningT4SpeakerOptions,
    correctAnswer: 'b',
    explanationKo:
      'Lucía의 파트너는 대화를 방해하지 않도록 “solo me corrige cuando repito varias veces el mismo fallo”라고 합니다. 모든 실수를 즉시 지적받지 않는 화자는 Lucía입니다.',
    tags: ['의견매칭', '듣기', '말하기연습'],
    ...listeningExpansionReview,
  },
  {
    id: 'l-t2-idiomas-06',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t2-experiencias-idiomas',
    prompt: 'Esta persona registra sus fallos y los repasa en un momento fijo de la semana.',
    options: listeningT4SpeakerOptions,
    correctAnswer: 'c',
    explanationKo:
      'Marcos는 “Anoto en un cuaderno los errores”라고 하며 일요일마다 다시 본다고 설명합니다. 오류를 기록하고 정기적으로 복습하는 화자는 Marcos입니다.',
    tags: ['의견매칭', '듣기', '복습전략'],
    ...listeningExpansionReview,
  },

  // Audición · Tarea 3 — Entrevista a un joven artista
  {
    id: 'l-t4-artista-01',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t4-entrevista-artista',
    prompt: '¿Qué le impulsó a crear su colección de esta manera?',
    options: [
      { key: 'a', text: 'La falta de recursos económicos para comprar materiales.' },
      { key: 'b', text: 'El deseo de llamar la atención sobre el cuidado del medio ambiente.' },
      { key: 'c', text: 'Una propuesta de la galería de arte en la que expone.' },
    ],
    correctAnswer: 'b',
    explanationKo:
      'Mario는 쓰레기에서 아름다운 것이 탄생할 수 있음을 보여주고 관객들이 성찰하게 만들고 싶었다고 말합니다(hacer reflexionar al público). 환경 문제(impacto ambiental)에 대한 경각심을 일깨우고자 했으므로 b입니다.',
    tags: ['목적', '듣기', '환경'],
    ...listeningExpansionReview,
  },
  {
    id: 'l-t4-artista-02',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t4-entrevista-artista',
    prompt: 'En su opinión, lo más importante para alguien que empieza en el arte es…',
    options: [
      { key: 'a', text: 'tener un espacio de trabajo adecuado y organizado.' },
      { key: 'b', text: 'invertir en herramientas de buena calidad.' },
      { key: 'c', text: 'comunicar un mensaje personal con los medios disponibles.' },
    ],
    correctAnswer: 'c',
    explanationKo:
      '완벽한 작업실이나 비싼 도구(herramientas caras)를 기다리지 말고 당장 손에 있는 것으로 시작하라고 조언합니다. 예술은 소통하는 것이고 자신만의 목소리를 찾는 게 중요하므로 c가 맞습니다.',
    tags: ['조언', '듣기', '예술'],
    ...listeningExpansionReview,
  },
  {
    id: 'l-t4-artista-03',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t4-entrevista-artista',
    prompt: '¿Qué sorprendió a Mario de la reacción de los visitantes?',
    options: [
      { key: 'a', text: 'Se interesaron primero por el aspecto visual de las obras.' },
      { key: 'b', text: 'Rechazaron que utilizara materiales encontrados en la playa.' },
      { key: 'c', text: 'Comprendieron el mensaje antes de acercarse a los cuadros.' },
    ],
    correctAnswer: 'a',
    explanationKo:
      'Mario는 관객이 환경 메시지를 먼저 볼 줄 알았지만 실제로는 “se acercan atraídos por las texturas”라고 말합니다. 시각적 질감에 먼저 끌렸으므로 a입니다.',
    tags: ['반응', '듣기', '전시'],
    ...listeningExpansionReview,
  },
  {
    id: 'l-t4-artista-04',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t4-entrevista-artista',
    prompt: '¿Cuál es el objetivo principal de los talleres de Mario?',
    options: [
      { key: 'a', text: 'Preparar a jóvenes para una carrera artística profesional.' },
      { key: 'b', text: 'Enseñar datos científicos sobre la contaminación.' },
      { key: 'c', text: 'Cambiar la mirada sobre los residuos mediante la experimentación.' },
    ],
    correctAnswer: 'c',
    explanationKo:
      'Mario는 전문 예술가 양성이 목적이 아니며, 참가자들이 “observen de otra manera los objetos que desechan”라고 말합니다. 실험을 통해 폐기물을 보는 관점을 바꾸려는 것이므로 c입니다.',
    tags: ['목적', '듣기', '교육'],
    ...listeningExpansionReview,
  },
  {
    id: 'l-t4-artista-05',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t4-entrevista-artista',
    prompt: '¿Por qué Mario todavía no anuncia cuándo presentará su próximo proyecto?',
    options: [
      { key: 'a', text: 'Porque aún está explorando cómo combinar sus materiales.' },
      { key: 'b', text: 'Porque las familias no le han entregado las fotografías.' },
      { key: 'c', text: 'Porque quiere abandonar definitivamente los elementos reciclados.' },
    ],
    correctAnswer: 'a',
    explanationKo:
      '다음 작업은 사진과 현대 재료를 어떻게 결합할지 “Todavía estoy investigando” 중이라 날짜를 정하고 싶지 않다고 합니다. 따라서 a가 정답입니다.',
    tags: ['이유', '듣기', '창작과정'],
    ...listeningExpansionReview,
  },
  {
    id: 'l-t4-artista-06',
    skill: 'listening',
    kind: 'mcq',
    scriptId: 'listening-t4-entrevista-artista',
    prompt: '¿Qué tema quiere tratar Mario en su próximo trabajo?',
    options: [
      { key: 'a', text: 'La transformación de las playas urbanas.' },
      { key: 'b', text: 'Los recuerdos compartidos por una comunidad.' },
      { key: 'c', text: 'La falta de espacios para artistas jóvenes.' },
    ],
    correctAnswer: 'b',
    explanationKo:
      'Mario는 여러 동네 가족의 옛 사진을 활용해 “hablar de la memoria colectiva”에 관심이 있다고 합니다. 공동체가 공유하는 기억이 주제이므로 b입니다.',
    tags: ['주제', '듣기', '기억'],
    ...listeningExpansionReview,
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
    modelAnswerEs: `El viejo mercado que volvió a latir

Hace diez años, el mercado de la calle Mayor era un edificio triste y casi vacío. Muchos puestos habían cerrado y los vecinos preferían los grandes supermercados. Todo empezó a cambiar cuando un grupo de jóvenes decidió alquilar los locales abandonados y abrir cafeterías, librerías y puestos de productos locales.

Hoy, el mercado se ha convertido en el corazón del barrio. Los sábados se llena de familias y los pequeños comerciantes han recuperado sus ingresos. Sin embargo, este éxito también tiene una cara negativa: los precios han subido y algunos vecinos mayores se sienten desplazados.

En mi opinión, sería necesario mantener un equilibrio. El Ayuntamiento debería reservar algunos puestos para productos económicos y organizar actividades para todas las edades. Solo así el mercado seguirá siendo un lugar de encuentro y no únicamente un espacio de moda. Al fin y al cabo, un barrio vive de su gente.`,
    tags: ['기사', '지역사회', '묘사'],
    ...modelAnswerReview,
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
    modelAnswerEs: `Una semana sin notificaciones: lo que aprendí

Hace un mes decidí apagar todas las notificaciones del móvil durante siete días. Lo hice porque vivía pendiente de la pantalla y me costaba concentrarme incluso mientras estudiaba español. Mi única regla era revisar los mensajes solo dos veces al día.

Al principio fue más difícil de lo que esperaba. Los primeros días sentía una extraña ansiedad y comprobaba el teléfono por costumbre, aunque no sonara. Sin embargo, hacia el final de la semana ocurrió algo inesperado: leía más, dormía mejor y conversaba con mi familia sin distraerme.

No creo que esta experiencia sirva para todo el mundo. Quien dependa del móvil por trabajo tendrá muchas dificultades. Aun así, se la recomendaría a cualquiera que sienta que las pantallas controlan su tiempo. Basta con empezar por un fin de semana y desactivar solo las aplicaciones menos importantes. Al final, lo importante no es la tecnología, sino cómo la usamos.`,
    tags: ['블로그', '경험담', '디지털 습관'],
    ...modelAnswerReview,
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
    modelAnswerEs: `Buenos días. Hoy voy a hablar sobre la propuesta de limitar el tráfico de coches en el centro de la ciudad todos los fines de semana. Primero explicaré las ventajas, después los posibles problemas y, por último, daré mi opinión.

En cuanto a las ventajas, creo que son evidentes. Sin coches, el centro tendría menos ruido y menos contaminación, por lo que el aire sería más limpio. Además, las familias podrían pasear con tranquilidad, los niños jugarían con seguridad y los comercios con terraza atraerían a más clientes. En definitiva, la ciudad se volvería más humana.

Sin embargo, también hay que tener en cuenta algunos problemas. Por ejemplo, las personas mayores o con movilidad reducida podrían tener dificultades para llegar a sus casas. Asimismo, los repartidores y los comerciantes que necesitan el coche para cargar mercancías se verían perjudicados. No podemos olvidar a quienes viven en el centro y dependen del vehículo.

Entonces, ¿a quién beneficia y a quién afecta esta medida? Beneficiaría sobre todo a los peatones, a los ciclistas y al medio ambiente, mientras que perjudicaría a los conductores habituales y a ciertos negocios.

En mi opinión, estoy a favor de la propuesta, pero con matices. Para que funcione, habría que reforzar el transporte público, permitir el acceso a los residentes y a los vehículos autorizados, y crear zonas de carga y descarga en horarios concretos. Yo propondría empezar con una prueba de algunos meses y evaluar después los resultados. Muchas gracias por su atención.`,
    tags: ['발표', '도시', '찬반'],
    ...modelAnswerReview,
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
    modelAnswerEs: `En esta fotografía se ve a un grupo de personas de distintas edades reunidas alrededor de una mesa grande, probablemente en una cocina comunitaria o en un centro de barrio. En primer plano, una mujer mayor está enseñando a dos jóvenes a preparar una masa, mientras que al fondo un hombre corta verduras y una niña pone los platos. Todos parecen contentos y concentrados en lo que hacen.

Por sus gestos y sus sonrisas, imagino que se conocen bien y que existe una relación cercana, quizás de familia o de vecinos. Puede que la señora mayor sea quien dirige la actividad, porque los demás la escuchan con atención.

En cuanto a lo que pudo ocurrir antes, supongo que se han reunido para cocinar juntos una receta tradicional. Antes de la foto habrán ido a comprar los ingredientes y, después, seguramente compartirán la comida y charlarán durante horas.

En mi opinión, las actividades entre generaciones son muy valiosas. Los mayores transmiten su experiencia y sus recetas, y los jóvenes aportan energía y nuevas ideas. Además, este tipo de encuentros ayuda a combatir la soledad de las personas mayores. Personalmente, viví algo parecido cuando mi abuela me enseñó a cocinar, y por eso creo que deberíamos fomentar más estos espacios. Gracias.`,
    tags: ['사진 묘사', '추측', '세대'],
    ...modelAnswerReview,
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
    modelAnswerEs: `ENTREVISTADORA: Aquí tiene los resultados de la encuesta de satisfacción laboral. ¿Qué le llama más la atención?

CANDIDATO: Lo que más me sorprende es que un 62 % valore la flexibilidad horaria por encima de todo. Supongo que, después de los últimos años, mucha gente quiere conciliar mejor su vida personal y su trabajo.

ENTREVISTADORA: Es un dato interesante. ¿Y cómo interpreta que un 48 % piense que faltan oportunidades de formación?

CANDIDATO: Me parece preocupante. Puede que la empresa no esté invirtiendo lo suficiente en cursos y eso, a largo plazo, podría hacer que los empleados con más talento se marchen. ¿Usted está de acuerdo?

ENTREVISTADORA: Sí, comparto su opinión. También me ha llamado la atención que un 35 % prefiera el buen ambiente de equipo antes que el salario.

CANDIDATO: Exacto. Eso demuestra que el dinero no lo es todo y que las relaciones entre compañeros importan mucho. Quizás por eso convendría cuidar el clima laboral.

ENTREVISTADORA: Entonces, ¿por dónde empezaría usted?

CANDIDATO: Yo propondría priorizar dos medidas. A corto plazo, establecería unas normas claras de trabajo flexible, porque es lo más urgente. A medio plazo, dedicaría un presupuesto a la formación. ¿Le parece razonable ese orden?

ENTREVISTADORA: Me parece muy sensato. ¿Y cómo evaluaría los resultados?

CANDIDATO: Repetiría la encuesta dentro de seis meses para comprobar si la satisfacción ha mejorado. Así podríamos ajustar lo que no funcione.

ENTREVISTADORA: Perfecto. Muchas gracias por sus propuestas.`,
    tags: ['상호작용', '자료 해석', '직장'],
    ...modelAnswerReview,
  },

  // Comprensión de lectura · Tarea 2 (모의고사) — 네 사람의 해외 생활 매칭
  {
    id: 'r-anio-01',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t2-anio-fuera',
    prompt: '¿Quién se marchó al extranjero principalmente para mejorar su situación laboral?',
    options: anioFueraOptions,
    correctAnswer: 'b',
    explanationKo: 'Diego는 "por motivos económicos"로 떠나 "prácticas bien pagadas"(보수가 좋은 실습)를 구했다고 밝힙니다. 취업·경제적 동기가 분명한 사람은 Diego입니다.',
    tags: ['매칭', '동기'],
    ...examReadingReview,
  },
  {
    id: 'r-anio-02',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t2-anio-fuera',
    prompt: '¿Quién decidió estudiar una nueva carrera a raíz de su experiencia?',
    options: anioFueraOptions,
    correctAnswer: 'c',
    explanationKo: 'Lucía는 "la idea de estudiar Educación, algo que jamás me había planteado"라며 여행 후 새로운 전공을 결심했다고 말합니다.',
    tags: ['매칭', '진로'],
    ...examReadingReview,
  },
  {
    id: 'r-anio-03',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t2-anio-fuera',
    prompt: '¿Quién destaca haber aprendido a ser más autónomo en su vida diaria?',
    options: anioFueraOptions,
    correctAnswer: 'a',
    explanationKo: 'Marta는 "aprendido a organizarme sola, porque nadie me recordaba las fechas"라며 스스로를 관리하는 자율성을 강조합니다.',
    tags: ['매칭', '자기관리'],
    ...examReadingReview,
  },
  {
    id: 'r-anio-04',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t2-anio-fuera',
    prompt: '¿Quién menciona que le afectó el clima del país de acogida?',
    options: anioFueraOptions,
    correctAnswer: 'b',
    explanationKo: 'Diego만 "El invierno se me hizo eterno"라며 기후의 영향을 언급합니다. Lucía의 "altura"(고도)는 기후가 아닙니다.',
    tags: ['매칭', '적응'],
    ...examReadingReview,
  },
  {
    id: 'r-anio-05',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t2-anio-fuera',
    prompt: '¿Quién tardó en adaptarse a las costumbres sociales del lugar?',
    options: anioFueraOptions,
    correctAnswer: 'd',
    explanationKo: 'Andrés는 "me sentí perdido entre tantas normas sociales que no entendía"라며 사회적 관습 적응에 시간이 걸렸다고 합니다.',
    tags: ['매칭', '문화적응'],
    ...examReadingReview,
  },
  {
    id: 'r-anio-06',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t2-anio-fuera',
    prompt: '¿Quién mejoró su dominio del idioma gracias a una actividad de ocio?',
    options: anioFueraOptions,
    correctAnswer: 'a',
    explanationKo: 'Marta는 "amigos en el coro… eso mejoró mi acento más que cualquier libro"라며 합창단이라는 여가 활동으로 언어가 늘었다고 말합니다.',
    tags: ['매칭', '언어학습'],
    ...examReadingReview,
  },
  {
    id: 'r-anio-07',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t2-anio-fuera',
    prompt: '¿Quién empezó a dar importancia a la puntualidad?',
    options: anioFueraOptions,
    correctAnswer: 'b',
    explanationKo: 'Diego는 "la puntualidad… una forma de cuidar el tiempo de los demás"라며 시간 엄수의 가치를 배웠다고 합니다.',
    tags: ['매칭', '가치관'],
    ...examReadingReview,
  },
  {
    id: 'r-anio-08',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t2-anio-fuera',
    prompt: '¿Quién viajó sin una idea definida de lo que iba a hacer?',
    options: anioFueraOptions,
    correctAnswer: 'd',
    explanationKo: 'Andrés는 "me marché a Japón sin un plan claro"라며 뚜렷한 계획 없이 떠났다고 말합니다.',
    tags: ['매칭', '동기'],
    ...examReadingReview,
  },
  {
    id: 'r-anio-09',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t2-anio-fuera',
    prompt: '¿Quién comprobó que se puede vivir con pocos recursos?',
    options: anioFueraOptions,
    correctAnswer: 'c',
    explanationKo: 'Lucía는 "se puede vivir con mucho menos de lo que creemos"라며 적은 자원으로도 살 수 있음을 깨달았다고 합니다.',
    tags: ['매칭', '가치관'],
    ...examReadingReview,
  },
  {
    id: 'r-anio-10',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t2-anio-fuera',
    prompt: '¿Quién afirma que dejó de tener miedo a equivocarse?',
    options: anioFueraOptions,
    correctAnswer: 'a',
    explanationKo: 'Marta는 "perder el miedo a equivocarse"를 유학의 가장 큰 소득으로 꼽습니다.',
    tags: ['매칭', '태도'],
    ...examReadingReview,
  },

  // Comprensión de lectura · Tarea 3 (모의고사) — 문장 삽입: 주 4일 근무
  {
    id: 'r-sem4-01',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t3-semana-cuatro',
    prompt: 'Hueco [1]: ¿qué fragmento completa el texto?',
    options: semanaCuatroFragments,
    correctAnswer: 'c',
    explanationKo: '바로 뒤 "Por eso, sus defensores insisten…"의 근거가 되는 주장이 필요합니다. c(적게 일해도 생산이 반드시 줄지는 않는다)가 "그러므로 옹호자들이 집중을 강조한다"로 이어집니다.',
    tags: ['문장삽입', '결속성'],
    ...examReadingReview,
  },
  {
    id: 'r-sem4-02',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t3-semana-cuatro',
    prompt: 'Hueco [2]: ¿qué fragmento completa el texto?',
    options: semanaCuatroFragments,
    correctAnswer: 'f',
    explanationKo: '앞의 "la productividad no bajó"와 대조를 이루는 f("Al contrario… los indicadores subieron")가 들어가고, 뒤 문장의 "además"가 이를 보강합니다.',
    tags: ['문장삽입', '대조'],
    ...examReadingReview,
  },
  {
    id: 'r-sem4-03',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t3-semana-cuatro',
    prompt: 'Hueco [3]: ¿qué fragmento completa el texto?',
    options: semanaCuatroFragments,
    correctAnswer: 'a',
    explanationKo: '뒤의 "En esos casos"가 가리킬 특정 부문이 먼저 제시돼야 합니다. a(보건·산업처럼 중단할 수 없는 분야)가 그 지시 대상입니다.',
    tags: ['문장삽입', '지시어'],
    ...examReadingReview,
  },
  {
    id: 'r-sem4-04',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t3-semana-cuatro',
    prompt: 'Hueco [4]: ¿qué fragmento completa el texto?',
    options: semanaCuatroFragments,
    correctAnswer: 'e',
    explanationKo: '"Los críticos señalan otro riesgo" 뒤에는 그 위험의 내용이 와야 합니다. e(같은 업무를 더 적은 날에 몰아서 요구할까 우려)가 뒤의 "Si eso ocurriera"로 이어집니다.',
    tags: ['문장삽입', '결속성'],
    ...examReadingReview,
  },
  {
    id: 'r-sem4-05',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t3-semana-cuatro',
    prompt: 'Hueco [5]: ¿qué fragmento completa el texto?',
    options: semanaCuatroFragments,
    correctAnswer: 'd',
    explanationKo: '뒤의 "En otras palabras…"가 바꿔 말하는 원문이 필요합니다. d(회의만 그대로 유지되면 근무 단축은 소용없다)를 "결국 문제는 시계가 아니라 시간 활용"으로 재진술합니다.',
    tags: ['문장삽입', '재진술'],
    ...examReadingReview,
  },
  {
    id: 'r-sem4-06',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t3-semana-cuatro',
    prompt: 'Hueco [6]: ¿qué fragmento completa el texto?',
    options: semanaCuatroFragments,
    correctAnswer: 'g',
    explanationKo: '마지막 문장의 "Solo así"가 가리킬 방안이 앞에 와야 합니다. g(진짜 과제는 시간 단축이 아니라 업무 방식 재설계)가 그 지시 대상입니다.',
    tags: ['문장삽입', '지시어'],
    ...examReadingReview,
  },

  // Comprensión de lectura · Tarea 4 (모의고사) — cloze: pódcast
  {
    id: 'r-pod-01',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t4-podcast',
    prompt: 'Hueco [1]: elige la opción correcta.',
    options: [
      { key: 'a', text: 'Por eso' },
      { key: 'b', text: 'Sin embargo' },
      { key: 'c', text: 'Además' },
    ],
    correctAnswer: 'b',
    explanationKo: '"사라질 거라 예상했다"와 "정반대임이 드러났다" 사이의 역접이므로 Sin embargo가 맞습니다.',
    tags: ['빈칸', '연결어'],
    ...examReadingReview,
  },
  {
    id: 'r-pod-02',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t4-podcast',
    prompt: 'Hueco [2]: elige la opción correcta.',
    options: [
      { key: 'a', text: 'por' },
      { key: 'b', text: 'para' },
      { key: 'c', text: 'con' },
    ],
    correctAnswer: 'b',
    explanationKo: '목적(내려받아 듣기 위해)이므로 para + 부정사입니다.',
    tags: ['빈칸', 'por/para'],
    ...examReadingReview,
  },
  {
    id: 'r-pod-03',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t4-podcast',
    prompt: 'Hueco [3]: elige la opción correcta.',
    options: [
      { key: 'a', text: 'se deben' },
      { key: 'b', text: 'debe' },
      { key: 'c', text: 'se debe' },
    ],
    correctAnswer: 'c',
    explanationKo: '주어 "el éxito"(단수) + deberse a 구문이므로 se debe입니다.',
    tags: ['빈칸', '동사일치'],
    ...examReadingReview,
  },
  {
    id: 'r-pod-04',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t4-podcast',
    prompt: 'Hueco [4]: elige la opción correcta.',
    options: [
      { key: 'a', text: 'mientras' },
      { key: 'b', text: 'durante' },
      { key: 'c', text: 'aunque' },
    ],
    correctAnswer: 'a',
    explanationKo: '동사절 "se escucha"를 이끄는 동시성 접속사 mientras가 맞습니다. durante는 명사와 씁니다.',
    tags: ['빈칸', '연결어'],
    ...examReadingReview,
  },
  {
    id: 'r-pod-05',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t4-podcast',
    prompt: 'Hueco [5]: elige la opción correcta.',
    options: [
      { key: 'a', text: 'cuyos' },
      { key: 'b', text: 'que' },
      { key: 'c', text: 'quienes' },
    ],
    correctAnswer: 'b',
    explanationKo: '사물 선행사(programas)의 주격 관계사는 que입니다.',
    tags: ['빈칸', '관계사'],
    ...examReadingReview,
  },
  {
    id: 'r-pod-06',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t4-podcast',
    prompt: 'Hueco [6]: elige la opción correcta.',
    options: [
      { key: 'a', text: 'de' },
      { key: 'b', text: 'en' },
      { key: 'c', text: 'a' },
    ],
    correctAnswer: 'c',
    explanationKo: '형용사 adecuado는 전치사 a와 결합합니다(adecuado a sus intereses).',
    tags: ['빈칸', '전치사'],
    ...examReadingReview,
  },
  {
    id: 'r-pod-07',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t4-podcast',
    prompt: 'Hueco [7]: elige la opción correcta.',
    options: [
      { key: 'a', text: 'aunque' },
      { key: 'b', text: 'cuando' },
      { key: 'c', text: 'porque' },
    ],
    correctAnswer: 'a',
    explanationKo: '"제작은 저렴해도 유지에는 시간이 든다"는 양보 관계이므로 aunque입니다.',
    tags: ['빈칸', '연결어'],
    ...examReadingReview,
  },
  {
    id: 'r-pod-08',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t4-podcast',
    prompt: 'Hueco [8]: elige la opción correcta.',
    options: [
      { key: 'a', text: 'nacerán' },
      { key: 'b', text: 'nacían' },
      { key: 'c', text: 'nacen' },
    ],
    correctAnswer: 'c',
    explanationKo: '일반적 현재이며 뒤의 "desaparecen"과 시제가 병렬되므로 nacen입니다.',
    tags: ['빈칸', '시제'],
    ...examReadingReview,
  },
  {
    id: 'r-pod-09',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t4-podcast',
    prompt: 'Hueco [9]: elige la opción correcta.',
    options: [
      { key: 'a', text: 'contar con' },
      { key: 'b', text: 'contar por' },
      { key: 'c', text: 'contar de' },
    ],
    correctAnswer: 'a',
    explanationKo: '"보유하다·의지하다"의 뜻은 contar con입니다(una comunidad fiel).',
    tags: ['빈칸', '연어'],
    ...examReadingReview,
  },
  {
    id: 'r-pod-10',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t4-podcast',
    prompt: 'Hueco [10]: elige la opción correcta.',
    options: [
      { key: 'a', text: 'porque' },
      { key: 'b', text: 'para que' },
      { key: 'c', text: 'para' },
    ],
    correctAnswer: 'b',
    explanationKo: '주어가 바뀌고 뒤가 접속법 "sigan"이므로 목적의 para que입니다(para+부정사는 동일 주어).',
    tags: ['빈칸', '접속법'],
    ...examReadingReview,
  },
  {
    id: 'r-pod-11',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t4-podcast',
    prompt: 'Hueco [11]: elige la opción correcta.',
    options: [
      { key: 'a', text: 'será' },
      { key: 'b', text: 'sea' },
      { key: 'c', text: 'fuera' },
    ],
    correctAnswer: 'a',
    explanationKo: '"no está claro si…"의 간접의문은 직설법을 취하므로 미래 será입니다.',
    tags: ['빈칸', '서법'],
    ...examReadingReview,
  },
  {
    id: 'r-pod-12',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t4-podcast',
    prompt: 'Hueco [12]: elige la opción correcta.',
    options: [
      { key: 'a', text: 'en' },
      { key: 'b', text: 'para' },
      { key: 'c', text: 'por' },
    ],
    correctAnswer: 'c',
    explanationKo: '관용 표현 "por primera vez"입니다.',
    tags: ['빈칸', 'por/para'],
    ...examReadingReview,
  },
  {
    id: 'r-pod-13',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t4-podcast',
    prompt: 'Hueco [13]: elige la opción correcta.',
    options: [
      { key: 'a', text: 'está' },
      { key: 'b', text: 'esté' },
      { key: 'c', text: 'estaría' },
    ],
    correctAnswer: 'b',
    explanationKo: '불확실을 나타내는 "Quizá"는 접속법을 유도하므로 esté입니다.',
    tags: ['빈칸', '접속법'],
    ...examReadingReview,
  },
  {
    id: 'r-pod-14',
    skill: 'reading',
    kind: 'mcq',
    textId: 'reading-t4-podcast',
    prompt: 'Hueco [14]: elige la opción correcta.',
    options: [
      { key: 'a', text: 'contarán' },
      { key: 'b', text: 'cuentan' },
      { key: 'c', text: 'cuenten' },
    ],
    correctAnswer: 'c',
    explanationKo: '"gustar que + 접속법" 구문이므로 cuenten입니다.',
    tags: ['빈칸', '접속법'],
    ...examReadingReview,
  },
] satisfies PracticeItem[];
