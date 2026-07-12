import type { ListeningScript } from '../lib/types';

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

const sourceNote =
  'DELE B2 유형을 참고해 Spanish Lab이 새로 제작한 창작 스크립트이며, 음성은 TTS로 합성한 것으로 공식 기출 음원이 아닙니다.';

export const listeningScripts: ListeningScript[] = [
  {
    id: 'listening-t3-entrevista-sueno',
    task: 'tarea3',
    title: 'Entrevista a una investigadora del sueño',
    audioSrc: '/audio/listening/listening-t3-entrevista-sueno.m4a',
    transcript: `PERIODISTA: Buenas tardes a todos. Hoy nos acompaña Elena Ruiz, investigadora especializada en el sueño. Doctora, gracias por estar con nosotros.
DOCTORA: Gracias a vosotros por la invitación.
PERIODISTA: Su equipo acaba de publicar un estudio sobre el descanso de los adolescentes. ¿Cuál fue el resultado que más le sorprendió?
DOCTORA: Esperábamos encontrar que los adolescentes duermen poco; eso ya lo sabíamos. Lo que nos sorprendió fue la diferencia entre la semana y el fin de semana. Muchos intentan recuperar el sueño durmiendo hasta mediodía el sábado, y esa costumbre, lejos de ayudar, desajusta todavía más su reloj interno.
PERIODISTA: Entonces, ¿dormir más el fin de semana es un error?
DOCTORA: No exactamente. Recuperar una hora o dos no hace daño. El problema aparece cuando la diferencia supera las tres horas, porque el cuerpo vive algo parecido a un cambio de zona horaria cada semana.
PERIODISTA: En el estudio también hablan de las pantallas. Todo el mundo las señala como culpables.
DOCTORA: Y en parte lo son, pero no por la luz, como suele decirse. Según nuestros datos, lo que más retrasa el sueño no es el brillo de la pantalla, sino el contenido. Los vídeos y los juegos están diseñados para que sigamos mirando un poco más.
PERIODISTA: ¿Qué recomienda a las familias?
DOCTORA: Más que prohibir, aconsejo acordar un horario con los propios adolescentes. Cuando la norma se decide entre todos, se cumple durante más tiempo. Y una cosa más: la habitación debe asociarse con dormir, no con estudiar hasta medianoche.
PERIODISTA: ¿Y las siestas? En muchos países son casi una tradición.
DOCTORA: Una siesta corta, de unos veinte minutos, mejora la atención por la tarde. Las siestas largas, en cambio, roban horas al sueño nocturno. En resumen: regularidad, acuerdos y un poco de sentido común.
PERIODISTA: Doctora Ruiz, ha sido un placer. Volveremos a invitarla cuando publiquen la próxima fase del estudio.
DOCTORA: Encantada. Hasta pronto.`,
    voices: {
      PERIODISTA: 'es-MX-JorgeNeural',
      DOCTORA: 'es-ES-ElviraNeural',
    },
    rate: '+0%',
    sourceNote,
    ...review,
  },
  {
    id: 'listening-t5-desperdicio-alimentos',
    task: 'tarea5',
    title: 'Charla: el desperdicio de alimentos en casa',
    audioSrc: '/audio/listening/listening-t5-desperdicio-alimentos.m4a',
    transcript: `CONFERENCIANTE: Buenos días y gracias por venir. Hoy quiero hablarles de algo que ocurre en todas nuestras cocinas: el desperdicio de alimentos. Cada año tiramos a la basura millones de toneladas de comida en perfecto estado, y solemos culpar a los supermercados o a los restaurantes. Sin embargo, los estudios europeos coinciden: más de la mitad del desperdicio se produce en los hogares.
CONFERENCIANTE: ¿Por qué tiramos tanta comida? La primera razón es la planificación, o mejor dicho, su ausencia. Compramos sin lista, aprovechamos ofertas de productos que no necesitamos y llenamos la nevera como si fuera infinita. La segunda razón es la confusión entre dos etiquetas: la fecha de caducidad, que sí indica un riesgo para la salud, y la fecha de consumo preferente, que solo informa de que el producto puede perder sabor o textura. Un yogur que ha pasado esa segunda fecha no es peligroso, aunque muchas personas lo tiran por precaución.
CONFERENCIANTE: ¿Qué podemos hacer? Les propongo tres gestos sencillos. Primero, planificar el menú de la semana antes de comprar, aunque sea de forma aproximada. Segundo, colocar delante, a la vista, los productos que caducan antes; lo que no se ve, no se come. Y tercero, perder el miedo a congelar: el pan, el queso e incluso muchos platos cocinados aguantan semanas en el congelador.
CONFERENCIANTE: Termino con una idea. Reducir el desperdicio no exige grandes sacrificios, sino pequeños hábitos repetidos. Si esta charla les sirve para salvar una sola bolsa de comida a la semana, habrá valido la pena. Muchas gracias.`,
    voices: {
      CONFERENCIANTE: 'es-ES-ElviraNeural',
    },
    rate: '+0%',
    sourceNote,
    ...review,
  },
  {
    id: 'listening-t1-anuncio-estacion',
    task: 'tarea1',
    title: 'Aviso en la estación de tren',
    audioSrc: '/audio/listening/listening-t1-anuncio-estacion.m4a',
    transcript: `LOCUTOR: Atención, por favor. Los pasajeros con destino a Sevilla, cuyo tren tenía salida prevista a las diecisiete treinta horas, deben dirigirse a la vía número cuatro en lugar de la vía número seis. Les informamos que, debido a una avería en las instalaciones, el tren sufrirá un retraso estimado de veinte minutos. Sentimos las molestias que esto les pueda ocasionar y les rogamos que permanezcan atentos a próximos avisos. Muchas gracias.`,
    voices: {
      LOCUTOR: 'es-ES-AlvaroNeural',
    },
    rate: '+5%',
    sourceNote,
    ...review,
  },
  {
    id: 'listening-t1-reserva-restaurante',
    task: 'tarea1',
    title: 'Cambio de una reserva en un restaurante',
    audioSrc: '/audio/listening/listening-t1-reserva-restaurante.m4a',
    transcript: `CLIENTA: Buenas tardes. Tengo una mesa reservada para cuatro a las nueve, a nombre de Laura Pérez, pero dos amigos llegarán media hora tarde. ¿Podríamos retrasar la reserva?
CAMARERO: A las nueve y media ya no nos queda ninguna mesa grande. Si vienen ustedes dos a la hora prevista, podemos mantenerla hasta que lleguen sus amigos.
CLIENTA: De acuerdo, entonces iremos puntuales y pediremos algo mientras esperamos. Muchas gracias.`,
    voices: {
      CLIENTA: 'es-ES-ElviraNeural',
      CAMARERO: 'es-ES-AlvaroNeural',
    },
    rate: '+0%',
    sourceNote,
    ...listeningExpansionReview,
  },
  {
    id: 'listening-t1-devolucion-biblioteca',
    task: 'tarea1',
    title: 'Devolución de un libro en la biblioteca',
    audioSrc: '/audio/listening/listening-t1-devolucion-biblioteca.m4a',
    transcript: `USUARIO: Hola. Venía a devolver esta novela, pero he visto que la biblioteca cerrará mañana por obras. ¿Puedo llevarme hoy otro libro?
BIBLIOTECARIA: Claro. El préstamo funciona con normalidad esta tarde. Además, como permaneceremos cerrados toda la semana, tendrá diez días adicionales para devolverlo.
USUARIO: Perfecto. Entonces buscaré la nueva novela de Mendoza, si está disponible.
BIBLIOTECARIA: Está prestada, pero puedo reservarla para usted.`,
    voices: {
      USUARIO: 'es-MX-JorgeNeural',
      BIBLIOTECARIA: 'es-US-PalomaNeural',
    },
    rate: '-2%',
    sourceNote,
    ...listeningExpansionReview,
  },
  {
    id: 'listening-t1-bicicleta-vecina',
    task: 'tarea1',
    title: 'Una bicicleta en el portal',
    audioSrc: '/audio/listening/listening-t1-bicicleta-vecina.m4a',
    transcript: `VECINO: Ana, ¿es tuya la bicicleta que está junto al ascensor? El presidente ha pedido que no dejemos nada en el portal.
VECINA: Sí, perdona. Se rompió la cerradura del cuarto de bicicletas y la subí anoche para que no la robaran.
VECINO: El técnico viene esta tarde. Mientras tanto, puedes guardarla en mi trastero.
VECINA: Gracias, la bajaré ahora mismo y esta noche la pondré en su sitio.`,
    voices: {
      VECINO: 'es-US-AlonsoNeural',
      VECINA: 'es-ES-ElviraNeural',
    },
    rate: '+1%',
    sourceNote,
    ...listeningExpansionReview,
  },
  {
    id: 'listening-t1-cambio-chaqueta',
    task: 'tarea1',
    title: 'Cambio de una chaqueta',
    audioSrc: '/audio/listening/listening-t1-cambio-chaqueta.m4a',
    transcript: `DEPENDIENTA: ¿En qué puedo ayudarle?
CLIENTE: Me regalaron esta chaqueta, pero me queda grande. No tengo el recibo porque fue un regalo.
DEPENDIENTA: Podemos cambiarla por otra talla si conserva la etiqueta. De ese color no queda la mediana, aunque podemos pedirla y recibirla el jueves.
CLIENTE: El viernes viajo. Prefiero probarme la azul, que parece igual.
DEPENDIENTA: Sí, el modelo es el mismo y cuesta exactamente lo mismo.`,
    voices: {
      DEPENDIENTA: 'es-US-PalomaNeural',
      CLIENTE: 'es-MX-JorgeNeural',
    },
    rate: '+0%',
    sourceNote,
    ...listeningExpansionReview,
  },
  {
    id: 'listening-t1-cita-dentista',
    task: 'tarea1',
    title: 'Una llamada de la clínica dental',
    audioSrc: '/audio/listening/listening-t1-cita-dentista.m4a',
    transcript: `RECEPCIONISTA: Buenos días, llamo de la clínica Robles. La doctora no podrá atenderle mañana a las diez por una urgencia. Tenemos un hueco a las doce o, si lo prefiere, el miércoles a primera hora.
PACIENTE: Mañana al mediodía estoy en una reunión. El miércoles puedo llegar a las ocho y media.
RECEPCIONISTA: Perfecto. Le cambio la cita al miércoles a esa hora. Recibirá la confirmación por mensaje.
PACIENTE: Muchas gracias.`,
    voices: {
      RECEPCIONISTA: 'es-ES-ElviraNeural',
      PACIENTE: 'es-US-AlonsoNeural',
    },
    rate: '-1%',
    sourceNote,
    ...listeningExpansionReview,
  },
  {
    id: 'listening-t2-fiesta-barrio',
    task: 'tarea2',
    title: 'Preparativos para la fiesta del barrio',
    audioSrc: '/audio/listening/listening-t2-fiesta-barrio.m4a',
    transcript: `DIEGO: Sofía, ¿al final vas a ayudar en la fiesta del barrio? Ayer no te vi en la reunión de voluntarios.
SOFÍA: Sí, aunque reconozco que al principio no quería apuntarme. Pensaba que habría demasiada gente y que acabaría pasando el día entre empujones. Pero Marta me explicó que este año limitarán el aforo de la plaza.
DIEGO: Me alegro. Yo participo desde hace tres años. Lo que más me gusta no son los conciertos, sino conocer a vecinos con los que normalmente solo coincido en el ascensor.
SOFÍA: Eso también me atrae. He propuesto organizar un taller para que los niños construyan instrumentos con envases usados. Necesito que alguien consiga cajas y botellas limpias.
DIEGO: Puedo pedirlas en la cafetería de la esquina. Eso sí, prefiero preparar una lista esta misma semana. Cuando dejamos las cosas para el último momento, terminamos comprando material que ya teníamos.
SOFÍA: Totalmente. Yo me encargo de preguntar a las familias cuántos niños vendrán. Así sabremos si hacen falta dos monitores o cuatro. Por cierto, ¿ya está resuelto lo del escenario?
DIEGO: No del todo. El proveedor habitual ha subido mucho el precio. Algunos quieren cancelar la música, pero yo buscaría primero un escenario más pequeño. No hace falta gastar más; podemos adaptar el programa.
SOFÍA: Estoy de acuerdo. Incluso podríamos empezar con los músicos del barrio y dejar al grupo invitado para el final. Lo importante es que el cambio se anuncie bien.
DIEGO: Para la difusión, había pensado crear una cuenta nueva en redes sociales.
SOFÍA: Servirá para los jóvenes, pero no debería ser el único medio. Mi vecina nunca mira esas aplicaciones. Pondría carteles en el mercado y dejaría programas impresos en el centro de salud.
DIEGO: Buena idea. También podríamos pedir a los comercios que los entreguen con las compras. Yo redacto el programa, pero necesito que alguien lo revise: siempre se me escapa alguna fecha.
SOFÍA: Envíamelo y lo reviso. A cambio, ayúdame el sábado a probar el taller. Nunca he trabajado con un grupo grande de niños y quiero comprobar cuánto dura cada actividad.
DIEGO: Hecho. Podemos invitar a mis sobrinos. Si pierden el interés a los diez minutos, sabremos que hay que simplificarla.
SOFÍA: Perfecto. Al final me estoy ilusionando más de lo que esperaba. Me preocupaba que los voluntarios veteranos no aceptaran ideas nuevas, pero todos han sido bastante abiertos.
DIEGO: Es que la fiesta funciona precisamente porque cada año cambia un poco. Si repetimos todo sin escuchar a la gente, deja de representar al barrio.
SOFÍA: Entonces nos vemos el sábado. Llevaré un modelo del instrumento y una lista de materiales.
DIEGO: Y yo traeré las cajas. Esta vez llegaremos preparados a la reunión.`,
    voices: {
      DIEGO: 'es-ES-AlvaroNeural',
      SOFÍA: 'es-US-PalomaNeural',
    },
    rate: '+8%',
    sourceNote,
    ...listeningExpansionReview,
  },
  // 이 id는 역사적 명칭이며 script.task가 현재 시험 배치의 진실이다.
  {
    id: 'listening-t2-experiencias-idiomas',
    task: 'tarea4',
    title: 'Experiencias de aprendizaje de idiomas',
    audioSrc: '/audio/listening/listening-t2-experiencias-idiomas.m4a',
    transcript: `PRESENTADOR: Hoy en nuestro programa hablamos de cómo aprender idiomas. Tenemos a cuatro oyentes en línea. Empezamos con Carlos.
CARLOS: Hola. Yo he descubierto que apuntarme a clases tradicionales no me funciona. Lo que de verdad me hizo avanzar con el inglés fue jugar a videojuegos con gente de otros países. Así aprendí sin darme cuenta. Como necesitaba reaccionar rápido, dejé de traducir cada frase mentalmente. La competición me motivaba a buscar después las palabras que no había entendido.
PRESENTADOR: Gracias, Carlos. Ahora escuchamos a Lucía.
LUCÍA: Buenas tardes. Para mí, la clave es perder el miedo a hablar. Al principio cometía muchísimos errores gramaticales, pero me forzaba a hablar con nativos en intercambios. Poco a poco gané fluidez y los errores fueron desapareciendo solos. Mi compañera solo me corrige cuando repito varias veces el mismo fallo, para no interrumpir la conversación. Además, grabo un mensaje de voz cada semana y así noto mis avances.
PRESENTADOR: Muy interesante, Lucía. ¿Qué nos cuentas tú, Marcos?
MARCOS: Hola a todos. Pues yo soy todo lo contrario. Necesito mucha estructura. Si no entiendo la gramática desde la base, me siento perdido. Compro libros de ejercicios y dedico al menos una hora diaria a repasar la teoría. Anoto en un cuaderno los errores de cada ejercicio y los reviso los domingos. Aun así, sé que después tengo que usar esas reglas hablando con alguien.
PRESENTADOR: Y por último, tenemos a Elena.
ELENA: Buenas. Mi método es el entretenimiento. Veo series, películas y escucho podcasts constantemente en el idioma que quiero aprender. Al final, el oído se acostumbra a la pronunciación y adquiero vocabulario de forma natural. Primero veo cada episodio con subtítulos en el mismo idioma y luego repito algunas escenas sin ellos. Apunto expresiones completas, no palabras aisladas, e intento utilizarlas al día siguiente.
PRESENTADOR: Cuatro estrategias muy diferentes. Gracias a todos por compartir sus experiencias.`,
    voices: {
      PRESENTADOR: 'es-MX-JorgeNeural',
      CARLOS: 'es-ES-AlvaroNeural',
      LUCÍA: 'es-ES-ElviraNeural',
      MARCOS: 'es-US-AlonsoNeural',
      ELENA: 'es-US-PalomaNeural',
    },
    rate: '+0%',
    sourceNote,
    ...listeningExpansionReview,
  },
  // 이 id는 역사적 명칭이며 script.task가 현재 시험 배치의 진실이다.
  {
    id: 'listening-t4-entrevista-artista',
    task: 'tarea3',
    title: 'Entrevista a un joven artista',
    audioSrc: '/audio/listening/listening-t4-entrevista-artista.m4a',
    transcript: `PERIODISTA: Hoy estamos con Mario, un joven artista que acaba de inaugurar su primera exposición. Mario, felicidades. ¿Cómo te sientes al ver tus obras en esta galería?
MARIO: Muchas gracias. La verdad es que estoy emocionado y un poco abrumado. Llevo trabajando en esta colección casi dos años en el sótano de mi casa, y verla aquí, con tanta gente interesada, es un sueño cumplido.
PERIODISTA: Tus cuadros destacan por el uso de colores muy vivos y materiales reciclados. ¿De dónde surge esta idea?
MARIO: Siempre me ha preocupado el impacto ambiental de nuestro consumo. Un día empecé a recoger plásticos y cartones abandonados en la playa. Quería demostrar que de la basura puede nacer algo hermoso y, al mismo tiempo, hacer reflexionar al público.
PERIODISTA: ¿Ha reaccionado el público como esperabas?
MARIO: No del todo. Imaginaba que la gente se fijaría primero en el mensaje ecológico, pero muchos visitantes se acercan atraídos por las texturas. Solo después descubren de qué están hechas las obras. Esa sorpresa abre conversaciones que yo no habría conseguido provocar con un cartel informativo.
PERIODISTA: También organizas talleres en un centro juvenil. ¿Qué buscas con esa actividad?
MARIO: No pretendo formar artistas profesionales. Quiero que los participantes observen de otra manera los objetos que desechan y se atrevan a experimentar sin miedo a equivocarse. A veces una sesión breve cambia más hábitos que una charla llena de datos.
PERIODISTA: ¿Qué le dirías a otros jóvenes que quieren dedicarse al arte pero no se atreven?
MARIO: Que no esperen a tener el estudio perfecto o los mejores materiales. Que empiecen hoy mismo con lo que tengan a mano. El arte se trata de comunicar, no de tener herramientas caras. Lo importante es encontrar tu propia voz.
PERIODISTA: ¿Y cuál será tu próximo proyecto cuando termine la exposición?
MARIO: Trabajaré con fotografías antiguas que me han prestado varias familias del barrio. Todavía estoy investigando cómo combinarlas con materiales actuales, así que no quiero fijar una fecha. Esta vez me interesa hablar de la memoria colectiva, aunque mantendré el uso de elementos recuperados.
PERIODISTA: Un proyecto prometedor. Muchas gracias por tu tiempo, Mario.`,
    voices: {
      PERIODISTA: 'es-ES-ElviraNeural',
      MARIO: 'es-ES-AlvaroNeural',
    },
    rate: '+0%',
    sourceNote,
    ...listeningExpansionReview,
  },
];
