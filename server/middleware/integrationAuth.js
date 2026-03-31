export const requireIntegrationApiKey = (req, res, next) => {
  const expectedApiKey = process.env.INTEGRATION_API_KEY;

  if (!expectedApiKey) {
    return res.status(503).json({
      success: false,
      message: "Integration API is not configured on server"
    });
  }

  const providedApiKey = req.header("x-api-key");
  if (!providedApiKey || providedApiKey !== expectedApiKey) {
    return res.status(401).json({
      success: false,
      message: "Invalid API key"
    });
  }

  next();
};
