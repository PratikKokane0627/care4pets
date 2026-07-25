const errorMiddleware = (err, req, res, next) => {

    // Default status code
    let statusCode = err.statusCode || err.status || 500;

    // Default message
    let message = err.message || "Internal Server Error";

    if (err.name === "ValidationError") {
      statusCode = 400;
      message = Object.values(err.errors).map((item) => item.message).join(", ");
    }

    if (err.name === "CastError") {
      statusCode = 400;
      message = "Invalid resource identifier";
    }

    if (err.code === 11000) {
      statusCode = 409;
      message = "A resource with this value already exists";
    }

    if (err.type === "entity.parse.failed") {
      statusCode = 400;
      message = "Invalid JSON request body";
    }

    if (err.code === "LIMIT_FILE_SIZE") {
      statusCode = 400;
      message = "Uploaded file must not exceed 5 MB";
    }

    if (statusCode === 500 && process.env.NODE_ENV === "production") {
      message = "Internal Server Error";
    }

    res.status(statusCode).json({
        success: false,
        message
    });

};

export default errorMiddleware;
