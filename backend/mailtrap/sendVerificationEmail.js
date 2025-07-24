import { mailtrapClient, sender } from "./mailtrap.config.js";

export async function sendVerificationEmail({ to, subject, text }) {
    try {
        const recipient = { name: "User", email: to };
        const response = await mailtrapClient.send({
            from: sender,
            to: [recipient],
            subject,
            text,
            category: "verification",
        });
        return response;
    } catch (error) {
        console.error("Mailtrap send error:", error);
        throw error;
    }
}
