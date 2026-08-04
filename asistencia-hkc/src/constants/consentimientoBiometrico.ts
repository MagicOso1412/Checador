import { VERSION_TEXTO_CONSENTIMIENTO_BIOMETRICO } from "@/domain/entities/ConsentimientoBiometrico";

export { VERSION_TEXTO_CONSENTIMIENTO_BIOMETRICO };

/**
 * Nombre de la empresa/responsable a mostrar en el aviso — **placeholder**.
 * Cámbialo por el nombre legal real de la empresa antes de usar esto en
 * producción; un aviso de privacidad sin un responsable identificable no
 * cumple con el Art. 15-16 de la LFPDPPP. Igual de importante: agrega un
 * medio de contacto real (correo o teléfono de RH) donde se puedan ejercer
 * derechos ARCO — hoy el texto solo dice "contacta a RH" sin un dato
 * concreto, que es un placeholder también.
 */
export const RESPONSABLE_DATOS = "HKC Construcción"; // TODO: confirmar razón social real

/**
 * Texto de consentimiento biométrico mostrado antes de capturar la primera
 * foto de referencia de un trabajador (o de nuevo si `VERSION_TEXTO_...`
 * cambió desde la última vez que aceptó). Explica qué se captura, para qué
 * (hoy y a futuro), dónde vive el dato, y los tres puntos que exige la
 * LFPDPPP para datos sensibles: que sea informado, voluntario y revocable.
 *
 * Escrito para leerse en una pantalla de celular, sin jerga legal densa —
 * quien lo lee es un trabajador de obra, no un abogado. No es un sustituto de
 * un aviso de privacidad legal completo (ese debe existir aparte, revisado
 * por un abogado); esto es el resumen que se muestra en el momento de pedir
 * el consentimiento, con referencia a dónde puede pedirse más información.
 */
export const TEXTO_CONSENTIMIENTO_BIOMETRICO = `Antes de capturar tus fotos de referencia, necesitamos tu consentimiento.

¿Qué se captura?
Hasta 5 fotografías de tu rostro, guardadas en este dispositivo como "fotos de referencia".

¿Para qué se usan?
Hoy sirven de apoyo visual para Recursos Humanos. Más adelante, ${RESPONSABLE_DATOS} planea usarlas para generar una plantilla biométrica que reconozca tu rostro automáticamente al registrar tu asistencia (entrada, salida, comida) — para agilizar el registro y evitar que alguien más marque por ti.

¿Dónde se guarda?
En este dispositivo, y cuando haya conexión, en los servidores que administra ${RESPONSABLE_DATOS}. Nunca se comparte con nadie fuera de la empresa.

Tu rostro es un dato sensible.
La ley (LFPDPPP) trata los datos biométricos como datos personales sensibles — por eso se te pide este consentimiento explícito, distinto del que ya diste para tus demás datos (nombre, número de empleado).

Es voluntario.
Si no aceptas, tu asistencia se sigue registrando normalmente, seleccionando tu nombre de una lista. No aceptar no tiene ninguna consecuencia laboral.

Es revocable.
Puedes retirar tu consentimiento cuando quieras. Al hacerlo, tus fotos de referencia se eliminan de este dispositivo.

Tienes derecho a acceder, corregir, cancelar tus datos u oponerte a este uso (derechos ARCO) contactando a Recursos Humanos.`;
