// la clase appError hereda los metodos de Error por medio de Extends
// constructor es llamado cada vez que se crea un objeto nuevo en esta clase
// super() se usa por lo general para llamar al constructor del padre (siempre en las clases extendidas)
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor)
    }
}

module.exports = AppError