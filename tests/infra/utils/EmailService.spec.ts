import nodemailer from "nodemailer";
import { EmailService } from "@/infra/utils";
import { ServiceException } from "@/infra/exceptions";

jest.mock("nodemailer");

const mockSendMail = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (nodemailer.createTransport as jest.Mock).mockReturnValue({
    sendMail: mockSendMail
  });
});

describe("[Utils] EmailService", () => {
  describe("constructor", () => {
    it("should initialize transporter with constructor params", () => {
      const service = new EmailService("smtp.test.com", 587, "user", "pass");

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: "smtp.test.com",
        port: 587,
        auth: { user: "user", pass: "pass" }
      });
    });

    it("should initialize transporter using environment variables", () => {
      process.env.SMTP_SERVER = "env.smtp.com";
      process.env.SMTP_PORT = "2525";
      process.env.SMTP_USER = "envUser";
      process.env.SMTP_PASSWORD = "envPass";

      const service = new EmailService();

      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: "env.smtp.com",
        port: 2525,
        auth: { user: "envUser", pass: "envPass" }
      });
    });

    it("should throw if required params and env variables are missing", () => {
      delete process.env.SMTP_SERVER;
      delete process.env.SMTP_PORT;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASSWORD;

      expect(() => new EmailService()).toThrow(ServiceException);
    });
  });

  describe("sendEmail", () => {
    let service: EmailService;

    beforeEach(() => {
      service = new EmailService("smtp.test.com", 587, "user", "pass");
    });

    it("should send email successfully", async () => {
      mockSendMail.mockResolvedValue({ rejected: [] });

      await expect(
        service.sendEmail("from@test.com", "to@test.com", "Subject", "Text", "<p>HTML</p>")
      ).resolves.toBeUndefined();

      expect(mockSendMail).toHaveBeenCalledWith({
        from: "from@test.com",
        to: "to@test.com",
        subject: "Subject",
        text: "Text",
        html: "<p>HTML</p>"
      });
    });

    it("should throw ServiceException if recipients are rejected", async () => {
      mockSendMail.mockResolvedValue({ rejected: ["bad@test.com"] });

      await expect(
        service.sendEmail("from@test.com", "bad@test.com", "Subject", "Text")
      ).rejects.toThrow(ServiceException);
    });

    it("should throw ServiceException on unexpected errors", async () => {
      mockSendMail.mockRejectedValue(new Error("SMTP connection failed"));

      await expect(
        service.sendEmail("from@test.com", "to@test.com", "Subject", "Text")
      ).rejects.toThrow(/An unexpected error occurred in EmailService/);
    });
  });
});
