const errorMiddleware = (err, req, res, next) => {

    // Default status code
    let statusCode = err.statusCode || 500;

    // Default message
    let message = err.message || "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        message
    });

};

export default errorMiddleware;