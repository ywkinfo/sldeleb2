import type { ListeningScript } from '../lib/types';

const review = {
  status: 'published' as const,
  reviewedBy: 'Spanish Lab · 스페인어 연구소',
  reviewedAt: '2026-07-11',
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
    id: 'listening-t2-experiencias-idiomas',
    task: 'tarea2',
    title: 'Experiencias de aprendizaje de idiomas',
    audioSrc: '/audio/listening/listening-t2-experiencias-idiomas.m4a',
    transcript: `PRESENTADOR: Hoy en nuestro programa hablamos de cómo aprender idiomas. Tenemos a cuatro oyentes en línea. Empezamos con Carlos.
CARLOS: Hola. Yo he descubierto que apuntarme a clases tradicionales no me funciona. Lo que de verdad me hizo avanzar con el inglés fue jugar a videojuegos con gente de otros países. Así aprendí sin darme cuenta.
PRESENTADOR: Gracias, Carlos. Ahora escuchamos a Lucía.
LUCÍA: Buenas tardes. Para mí, la clave es perder el miedo a hablar. Al principio cometía muchísimos errores gramaticales, pero me forzaba a hablar con nativos en intercambios. Poco a poco gané fluidez y los errores fueron desapareciendo solos.
PRESENTADOR: Muy interesante, Lucía. ¿Qué nos cuentas tú, Marcos?
MARCOS: Hola a todos. Pues yo soy todo lo contrario. Necesito mucha estructura. Si no entiendo la gramática desde la base, me siento perdido. Compro libros de ejercicios y dedico al menos una hora diaria a repasar la teoría.
PRESENTADOR: Y por último, tenemos a Elena.
ELENA: Buenas. Mi método es el entretenimiento. Veo series, películas y escucho podcasts constantemente en el idioma que quiero aprender. Al final, el oído se acostumbra a la pronunciación y adquiero vocabulario de forma natural.
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
    ...review,
  },
  {
    id: 'listening-t4-entrevista-artista',
    task: 'tarea4',
    title: 'Entrevista a un joven artista',
    audioSrc: '/audio/listening/listening-t4-entrevista-artista.m4a',
    transcript: `PERIODISTA: Hoy estamos con Mario, un joven artista que acaba de inaugurar su primera exposición. Mario, felicidades. ¿Cómo te sientes al ver tus obras en esta galería?
MARIO: Muchas gracias. La verdad es que estoy emocionado y un poco abrumado. Llevo trabajando en esta colección casi dos años en el sótano de mi casa, y verla aquí, con tanta gente interesada, es un sueño cumplido.
PERIODISTA: Tus cuadros destacan por el uso de colores muy vivos y materiales reciclados. ¿De dónde surge esta idea?
MARIO: Siempre me ha preocupado el impacto ambiental de nuestro consumo. Un día empecé a recoger plásticos y cartones abandonados en la playa. Quería demostrar que de la basura puede nacer algo hermoso y, al mismo tiempo, hacer reflexionar al público.
PERIODISTA: ¿Qué le dirías a otros jóvenes que quieren dedicarse al arte pero no se atreven?
MARIO: Que no esperen a tener el estudio perfecto o los mejores materiales. Que empiecen hoy mismo con lo que tengan a mano. El arte se trata de comunicar, no de tener herramientas caras. Lo importante es encontrar tu propia voz.
PERIODISTA: Un gran consejo. Muchas gracias por tu tiempo, Mario.`,
    voices: {
      PERIODISTA: 'es-ES-ElviraNeural',
      MARIO: 'es-ES-AlvaroNeural',
    },
    rate: '+0%',
    sourceNote,
    ...review,
  },
];
