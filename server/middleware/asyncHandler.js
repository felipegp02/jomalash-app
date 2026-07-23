// Express 4 no reenvia automaticamente los rechazos de promesas (ni los throw
// dentro de un handler async) a errorHandler; sin este wrapper la peticion
// se queda colgada en vez de responder con el error.
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
