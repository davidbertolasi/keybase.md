/* El Sparring · perfil del usuario.
   Estos datos entran en los prompts del coach y de la contraparte (antes estaban fijos en el código).
   Paso 1 del camino a multiusuario: cuando haya cuentas, esto sale de la base de datos y no de este archivo. */
window.SPARRING_PROFILE = {
  nombre: 'David',
  edad: 43,
  // Cómo lo presenta el ejercicio a la contraparte de negocios (una lista corta, sin punto final).
  oficio: 'abogado, desarrollador de loteos, productor musical, escritor',
  // Lo que "ella" sabe de él en el modo citas (una frase, sin punto final).
  bioCitas: 'abogado, desarrollador de loteos, productor de cumbia y de música clásica, escritor de libros de desarrollo personal, tres hijos con tres mujeres distintas, viajado, lee filosofía',
};
