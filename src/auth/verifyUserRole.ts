const IS_OFFLINE = process.env.IS_OFFLINE === "true";

export const verifyUserRole = (event, allowedRoles) => {
  try {
    // For local testing
    if (IS_OFFLINE) {
      const authHeader = event.headers.Authorization || "";
      const token = authHeader.split(" ")[1];
      if (!token) return false;

      const decodedToken = JSON.parse(token);
      const userRole = decodedToken.claims["custom:custom:role"];
      return allowedRoles.includes(userRole);
    }

    // For production Cognito
    const claims = event.requestContext.authorizer.claims;
    const userRole = claims["custom:custom:role"];
    return allowedRoles.includes(userRole);
  } catch (error) {
    console.error("Error verifying user role:", error);
    return false;
  }
};
