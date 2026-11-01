
const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((e) => {
        return {
          campo: e.path[0],
          message: e.message
        };
      });
      return res.status(400).json({ errors });
    }

    req.body = result.data;
    next();
  }
}

module.exports = validate;
