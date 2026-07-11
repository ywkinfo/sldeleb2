import type { ReadingText } from '../lib/types';

const review = {
  status: 'published' as const,
  reviewedBy: 'Spanish Lab · 스페인어 연구소',
  reviewedAt: '2026-07-11',
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
    id: 'reading-t4-huerto-azotea',
    task: 'tarea4',
    title: 'El huerto que creció sobre el mercado',
    passage: `Nadie prestaba atención a la azotea del mercado de Santa Clara hasta que un grupo de comerciantes propuso convertirla en huerto. Aunque al principio el proyecto parecía difícil, la asociación consiguió que una arquitecta comprobara la resistencia del edificio antes de instalar las primeras cajas de cultivo. Desde entonces, cada puesto se ocupa de una pequeña parcela, siempre que respete un calendario común de riego.

Los productos no se venden como si fueran mercancía del mercado, sino que se utilizan en talleres de cocina o se entregan a un comedor vecinal. Para que la iniciativa no dependa únicamente del entusiasmo de unas pocas personas, dos institutos participan durante el curso y documentan el crecimiento de las plantas. Los estudiantes comparan distintas técnicas y publican sus conclusiones, de modo que el huerto también funciona como laboratorio.

El mayor problema no ha sido la falta de agua, como se temía, sino el viento. Por mucho que se sujetaran las plantas jóvenes, algunas no resistían las ráfagas. Finalmente se colocaron barreras ligeras que dejan pasar el aire sin crear zonas de sombra. Si la próxima cosecha mantiene los resultados actuales, el Ayuntamiento estudiará adaptar otras cubiertas públicas.`,
    sourceNote,
    ...review,
  },
] satisfies ReadingText[];
