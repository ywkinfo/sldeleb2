import type { ReadingText } from '../lib/types';

const review = {
  status: 'published' as const,
  reviewedBy: 'Spanish Lab · 스페인어 연구소',
  reviewedAt: '2026-07-11',
};

// 읽기 모의고사(exam-reading-b2)용 신규 지문·문항의 검수 이력.
const examReadingReview = {
  status: 'published' as const,
  reviewedBy: 'Spanish Lab · 스페인어 연구소',
  reviewedAt: '2026-07-15',
};

const sourceNote =
  'DELE B2 유형을 참고해 Spanish Lab이 새로 제작한 창작 지문이며 공식 기출이 아닙니다.';

export const readingTexts = [
  {
    id: 'reading-t1-biblioteca-objetos',
    task: 'tarea1',
    title: 'Una biblioteca donde no se prestan libros',
    passage: `Cuando el Ayuntamiento de Valdemora anunció que abriría una «biblioteca de las cosas», muchos vecinos imaginaron un edificio lleno de objetos antiguos. El proyecto, sin embargo, nació con una intención muy práctica: permitir que cualquier persona pudiera pedir prestadas herramientas y aparatos que se usan pocas veces al año. Taladros, máquinas de coser, tiendas de campaña y proyectores ocupan ahora las estanterías donde antes se guardaban documentos municipales.

La iniciativa surgió después de una encuesta sobre residuos domésticos. Los responsables descubrieron que numerosos aparatos se tiraban no porque estuvieran estropeados, sino porque sus dueños ya no tenían espacio para guardarlos. Al mismo tiempo, algunas familias compraban esos mismos productos para utilizarlos solo una tarde. «Compartirlos era una respuesta lógica a los dos problemas», explica Marta Gil, coordinadora del centro.

Para hacerse socio basta con vivir o trabajar en el municipio y asistir a una breve sesión sobre el uso responsable del material. El préstamo es gratuito, aunque se cobra una pequeña cantidad si el objeto se devuelve tarde. Los usuarios también pueden donar aparatos, pero el equipo técnico los revisa antes de incorporarlos al catálogo. Esta medida ha evitado que el centro se convierta en un lugar donde abandonar objetos inservibles.

El primer año no estuvo libre de dificultades. Algunas herramientas regresaron incompletas y fue necesario crear inventarios más detallados. Además, los sábados se formaban largas colas. En lugar de reducir el servicio, el Ayuntamiento habilitó reservas por internet y amplió el horario con la ayuda de voluntarios. Desde entonces, el número de préstamos mensuales se ha duplicado.

Los organizadores insisten en que el éxito no debe medirse solo por la cantidad de objetos prestados. Una vez al mes se celebran talleres en los que los vecinos enseñan a reparar una lámpara, coser una prenda o montar una tienda de campaña. Gracias a esos encuentros, personas que antes apenas se saludaban han empezado a colaborar en otros proyectos del barrio.`,
    sourceNote,
    ...review,
  },
  {
    id: 'reading-t1-pueblos-teletrabajo',
    task: 'tarea1',
    title: 'Teletrabajar sin perder el pueblo',
    passage: `Durante décadas, San Román perdió habitantes cada año. Los jóvenes se marchaban a ciudades con más oportunidades y muchas viviendas quedaban cerradas casi todo el invierno. La llegada del teletrabajo parecía ofrecer una solución inmediata, pero el alcalde, Julián Sanz, desconfiaba de las campañas que prometían llenar el pueblo de nuevos residentes de un día para otro. «No queríamos atraer a cien personas y que noventa se fueran al terminar el verano», recuerda.

Por eso el municipio empezó con un programa modesto. Rehabilitó la antigua escuela como espacio de trabajo compartido, mejoró la conexión a internet y ofreció alquileres de seis meses, no estancias turísticas de fin de semana. Quienes solicitaban una plaza debían explicar qué necesitaban para quedarse y qué actividad podían compartir con la comunidad. No se exigía que abrieran un negocio, pero sí que participaran en alguna asociación local.

La primera convocatoria recibió más de cuatrocientas solicitudes para doce viviendas. Entre las personas seleccionadas había una traductora, dos diseñadores, un programador y una psicóloga que atiende a sus pacientes a distancia. Al principio, algunos vecinos temían que los recién llegados hicieran subir los alquileres. El Ayuntamiento respondió reservando parte de las viviendas rehabilitadas para familias del municipio y publicando los criterios de selección.

Dos años después, nueve de las doce personas iniciales continúan en San Román. El colegio no ha reabierto, como esperaban algunos medios, pero la tienda ha ampliado su horario y vuelve a haber autobús los viernes por la tarde. Los nuevos habitantes valoran la tranquilidad, aunque reconocen que dependen demasiado del coche y que los trámites sencillos exigen desplazarse a la capital de la comarca.

El alcalde considera que el resultado es positivo precisamente porque no es espectacular. Ahora otros pueblos piden copiar el modelo, pero él les aconseja estudiar primero sus propios recursos. Una buena conexión digital, afirma, no sustituye el transporte, la vivienda ni la disposición de los vecinos a integrar a personas con costumbres distintas.`,
    sourceNote,
    ...review,
  },
  {
    id: 'reading-t2-cine-barrio',
    task: 'tarea2',
    title: 'El cine que salvaron los vecinos',
    passage: `Cuando la empresa propietaria anunció el cierre del cine Avenida, casi nadie se sorprendió. La sala llevaba años medio vacía y sus dueños repetían que las plataformas digitales habían cambiado para siempre los hábitos del público. [ 1 ] Aquella reunión improvisada fue el origen de la cooperativa que hoy gestiona la única pantalla del barrio.

El primer obstáculo fue económico, porque la compra del local superaba con mucho los ahorros del grupo. Los impulsores lanzaron entonces una campaña de participaciones populares. [ 2 ] Con esa base, una entidad de crédito cooperativo aceptó financiar el resto de la operación.

La programación también cambió. En lugar de competir con los grandes estrenos, la nueva gestión apostó por ciclos temáticos, películas en versión original y sesiones matinales para institutos. [ 3 ] Gracias a ese equilibrio entre públicos, la sala abre ahora seis días a la semana.

No todo ha sido sencillo. El edificio, construido en los años cincuenta, necesitaba reformas que no podían aplazarse. [ 4 ] Las obras se hicieron por fases para que la sala nunca estuviera cerrada más de unas semanas seguidas.

Los socios insisten en que el proyecto no es únicamente cultural. [ 5 ] Por eso el vestíbulo acoge exposiciones de artistas locales y las entradas mantienen precios reducidos para estudiantes y jubilados.

El modelo empieza a despertar interés fuera del barrio. [ 6 ] Los fundadores responden siempre lo mismo: no se trata de copiar la fórmula, sino de escuchar primero lo que cada comunidad necesita.`,
    sourceNote,
    ...review,
  },
  {
    id: 'reading-t3-cambio-profesional',
    task: 'tarea3',
    title: 'Cuatro maneras de cambiar de profesión',
    passage: `A. LUCÍA — Durante diez años trabajé en una entidad bancaria. Me interesaba la educación financiera, pero no quería volver a la universidad durante cuatro años. Empecé dando talleres gratuitos los sábados y descubrí que sabía explicar conceptos complejos con ejemplos cotidianos. Una asociación me contrató a tiempo parcial y mantuve mi empleo anterior hasta comprobar que el nuevo sueldo era suficiente. El proceso fue lento, aunque esa transición gradual me permitió decidir sin angustia.

B. OMAR — Dejé la hostelería convencido de que la programación resolvería todos mis problemas laborales. Terminé un curso intensivo y conseguí prácticas, pero pasaba el día mirando una pantalla y echaba de menos el contacto con la gente. No considero que haya perdido el tiempo: ahora gestiono las reservas y la página web de un pequeño hotel. Volví al mismo sector con funciones distintas y mejores horarios.

C. ELENA — Mi empresa cerró cuando yo tenía cincuenta y dos años. Envié decenas de currículos sin respuesta y pensé que la edad me impediría empezar de nuevo. Una antigua compañera me pidió ayuda para organizar el almacén de su cooperativa. Acepté solo por unas semanas, pero propuse tantos cambios que acabaron ofreciéndome dirigir la logística. Mi experiencia, que algunas empresas veían como un inconveniente, allí resultó ser la principal ventaja.

D. TOMÁS — Siempre había reparado bicicletas para mis amigos y decidí abrir un taller. Calculé bien el precio de las herramientas, pero no el tiempo dedicado a facturas, proveedores y redes sociales. El primer año gané menos que como empleado. Pedí asesoramiento, compartí local con otra profesional y reservé una tarde para las tareas administrativas. El negocio funciona ahora, aunque sigo recordando que convertir una afición en profesión cambia la relación con aquello que te gusta.`,
    sourceNote,
    ...review,
  },
  {
    id: 'reading-t3-aprender-idiomas',
    task: 'tarea3',
    title: 'Cuatro maneras de aprender un idioma',
    passage: `A. DAVID — Me mudé a Dublín convencido de que el inglés se me pegaría solo por vivir allí. Al principio trabajaba con otros españoles y apenas avanzaba: entendía cada vez más, pero repetía los mismos errores. Acabé matriculándome en un curso nocturno y combinándolo con el trabajo. La estancia me dio soltura, aunque aprendí que la inmersión, sin estudio, se queda a medias.

B. NOELIA — Nunca he vivido en un país de habla alemana. Encontré una aplicación de intercambio y quedo por videollamada dos veces por semana con una estudiante de Colonia. Las primeras conversaciones eran caóticas: saltábamos de un idioma a otro sin ningún orden. Ahora dedicamos media hora exacta a cada lengua y anotamos las correcciones en una lista compartida. Sin esas reglas, habríamos abandonado hace tiempo.

C. RAQUEL — Durante dos años estudié japonés por mi cuenta con aplicaciones. Era cómodo y barato, pero llegó un momento en que repetía ejercicios sin mejorar y nadie me explicaba por qué una frase sonaba extraña. Me apunté a una escuela oficial y, aunque avanzo más despacio de lo que prometían las aplicaciones, las correcciones de la profesora me han quitado vicios que ni siquiera notaba.

D. IVÁN — Aprendí francés casi sin darme cuenta: series sin doblar, pódcast de baloncesto y un foro de cocina donde pasaba horas. Mi vocabulario sorprende a los profesores, pero escribir me costaba muchísimo porque nunca lo había practicado. Este curso me apunté a un taller de escritura en línea y redactar textos breves cada semana me obligó a ordenar por fin la gramática que ya conocía de oído.`,
    sourceNote,
    ...review,
  },
  {
    id: 'reading-t4-huerto-azotea',
    task: 'tarea4',
    title: 'El huerto que creció sobre el mercado',
    passage: `Nadie prestaba atención a la azotea del mercado de Santa Clara hasta que un grupo de comerciantes propuso convertirla en huerto. Aunque al principio el proyecto parecía difícil, la asociación consiguió que una arquitecta comprobara la resistencia del edificio antes de instalar las primeras cajas de cultivo. Desde entonces, cada puesto se ocupa de una pequeña parcela, siempre que respete un calendario común de riego.

Los productos no se venden como si fueran mercancía del mercado, sino que se utilizan en talleres de cocina o se entregan a un comedor vecinal. Para que la iniciativa no dependa únicamente del entusiasmo de unas pocas personas, dos institutos participan durante el curso y documentan el crecimiento de las plantas. Los estudiantes comparan distintas técnicas y publican sus conclusiones, de modo que el huerto también funciona como laboratorio.

El mayor problema no ha sido la falta de agua, como se temía, sino el viento. Por mucho que se sujetaran las plantas jóvenes, algunas no resistían las ráfagas. Finalmente se colocaron barreras ligeras que dejan pasar el aire sin crear zonas de sombra. Si la próxima cosecha mantiene los resultados actuales, el Ayuntamiento estudiará adaptar otras cubiertas públicas.`,
    sourceNote,
    ...review,
  },
  {
    id: 'reading-t4-club-lectura',
    task: 'tarea4',
    title: 'Un club de lectura dentro del hospital',
    passage: `Cuando la biblioteca municipal propuso crear un club de lectura en el hospital comarcal, algunos médicos dudaron de que los pacientes tuvieran ánimo para leer. La coordinadora defendió el proyecto puesto que la lectura compartida había dado buenos resultados en otros centros. Se acordó empezar con un grupo pequeño, de modo que fuera posible adaptar las sesiones a cada planta.

Las normas son flexibles. Los participantes pueden incorporarse en cualquier momento, a no ser que el personal sanitario recomiende lo contrario. Los libros se eligen por votación y las sesiones se celebran por la tarde, mientras que las mañanas se reservan para las pruebas médicas. A medida que el club fue creciendo, se sumaron familiares y hasta algunos enfermeros fuera de su turno.

Los voluntarios reciben una formación breve antes de participar. Pueden leer en voz alta con tal de que respeten el ritmo de cada paciente y eviten comentar diagnósticos. Aun cuando algunos participantes no terminan los libros, los organizadores consideran que el club cumple su función: durante una hora, la conversación gira en torno a una historia y no a la enfermedad.`,
    sourceNote,
    ...review,
  },
  {
    id: 'reading-t2-anio-fuera',
    task: 'tarea2',
    title: 'Un año fuera: cuatro experiencias',
    passage: `A. Marta
Elegí Italia por su arte, aunque al principio me costó seguir las clases en italiano. Con el tiempo hice amigos en el coro de la universidad, y eso mejoró mi acento más que cualquier libro. Lo que más valoro es haber aprendido a organizarme sola, porque nadie me recordaba las fechas de los exámenes. Volví convencida de que estudiar fuera no es solo aprender un idioma, sino perder el miedo a equivocarse.

B. Diego
Me fui a Alemania por motivos económicos: allí encontré prácticas bien pagadas en una empresa de ingeniería. El invierno se me hizo eterno y echaba de menos la comida de casa, pero el ambiente de trabajo era muy respetuoso con los horarios. Aprendí que la puntualidad no es una manía, sino una forma de cuidar el tiempo de los demás. Ahora aplico esa costumbre incluso en mi vida personal.

C. Lucía
Nunca pensé en un idioma cuando decidí hacer un voluntariado en Perú; quería ayudar en una escuela rural. Lo difícil no fue el trabajo, sino acostumbrarme a la altura y a la falta de internet. Descubrí que se puede vivir con mucho menos de lo que creemos. Regresé con la idea de estudiar Educación, algo que jamás me había planteado antes de aquel viaje.

D. Andrés
Después de años en la misma oficina, pedí un año sabático y me marché a Japón sin un plan claro. Al principio me sentí perdido entre tantas normas sociales que no entendía. Poco a poco aprendí a observar antes de actuar, y esa paciencia me ha servido mucho al volver al trabajo. No cambié de profesión, pero sí mi manera de relacionarme con los compañeros.`,
    sourceNote,
    ...examReadingReview,
  },
  {
    id: 'reading-t3-semana-cuatro',
    task: 'tarea3',
    title: '¿Menos horas, más vida?',
    passage: `Cada vez más empresas europeas experimentan con la semana laboral de cuatro días. [1] Por eso, sus defensores insisten en que la clave está en la concentración, no en la cantidad de horas.

Los primeros ensayos han dado resultados prometedores. En Islandia, por ejemplo, la productividad no bajó. [2] Muchos trabajadores afirmaron, además, que dormían mejor y discutían menos en casa.

Aun así, el modelo no encaja igual en todos los sectores. [3] En esos casos, reducir la jornada exige contratar a más personas, lo que encarece el servicio.

Los críticos señalan otro riesgo. [4] Si eso ocurriera, el supuesto avance se convertiría en una trampa para el empleado.

Con todo, el debate deja una enseñanza que va más allá del horario. [5] En otras palabras, el problema no es el reloj, sino cómo aprovechamos el tiempo.

[6] Solo así la semana de cuatro días dejará de ser una moda para convertirse en una forma distinta de entender el trabajo.`,
    sourceNote,
    ...examReadingReview,
  },
  {
    id: 'reading-t4-podcast',
    task: 'tarea4',
    title: 'El regreso de escuchar historias',
    passage: `Hace unos años, muchos pensaban que la radio tradicional estaba condenada a desaparecer. [1], la llegada de los pódcast ha demostrado justo lo contrario. Cada mes, millones de personas descargan programas [2] escucharlos cuando y donde quieren.

El éxito de este formato no [3] únicamente a la comodidad. A diferencia de la televisión, el pódcast permite hacer otras cosas [4] se escucha: cocinar, pasear o conducir. Además, existen programas [5] tratan temas muy específicos, de modo que cada oyente encuentra algo adecuado [6] sus intereses.

Los expertos señalan que, [7] producir un pódcast es relativamente barato, mantenerlo con calidad exige mucho tiempo. Por eso, muchos proyectos [8] con entusiasmo pero desaparecen en pocos meses. Los que sobreviven suelen [9] una comunidad fiel de seguidores.

Algunas plataformas han empezado a pagar a los creadores [10] sigan publicando de forma regular. No está claro todavía si ese modelo [11] sostenible a largo plazo. Lo que sí parece seguro es que, [12] primera vez en décadas, escuchar se ha vuelto tan popular como leer o ver la pantalla.

Quizá el secreto [13] en algo muy antiguo: a la gente siempre le ha gustado que le [14] una buena historia.`,
    sourceNote,
    ...examReadingReview,
  },
] satisfies ReadingText[];
