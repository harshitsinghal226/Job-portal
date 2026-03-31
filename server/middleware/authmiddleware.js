import jwt from "jsonwebtoken";
import Company from "../models/Company.js";

export const protectCompany = async (req, res, next) => {
  try {
    const token = req.headers.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    const company = await Company.findById(decoded.id);
    if (!company) {
      return res.status(401).json({
        success: false,
        message: "Company not found.",
      });
    }

    // Owner-first policy: prefer OWNER_COMPANY_EMAIL, else ALLOWED_COMPANY_EMAILS.
    // If neither is configured, deny by default for safety.
    const ownerEmail = (process.env.OWNER_COMPANY_EMAIL || process.env.OWNER_EMAIL || "").trim().toLowerCase();
    const allowlist = (process.env.ALLOWED_COMPANY_EMAILS || process.env.ALLOWED_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const emailLower = (company.email || "").toLowerCase();

    if (ownerEmail) {
      if (emailLower !== ownerEmail) {
        return res.status(403).json({
          success: false,
          message: "Your company is not authorized to perform this action.",
        });
      }
    } else if (allowlist.length > 0) {
      if (!allowlist.includes(emailLower)) {
        return res.status(403).json({
          success: false,
          message: "Your company is not authorized to perform this action.",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Recruiter access is disabled. Configure OWNER_COMPANY_EMAIL or ALLOWED_COMPANY_EMAILS.",
      });
    }

    req.company = company;
    next();
  } catch (err) {
    console.error("❌ Authentication error:", err.message);
    return res.status(401).json({
      success: false,
      message: "Invalid token.",
    });
  }
};
