import { User } from "../model/user.model.js";
import { sendVerificationEmail } from "../mailtrap/sendVerificationEmail.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendPasswordResetEmail } from "../mailtrap/emails.js";
import { sendWelcomeEmail } from "../mailtrap/emails.js";

import bcryptjs from "bcryptjs";
import crypto from "crypto";



export const register = async (req, res) => {
    const { email, password, name } = req.body;

	try {
		if (!email || !password || !name) {
			throw new Error("All fields are required");
		}

		const userAlreadyExists = await User.findOne({ email });
		console.log("userAlreadyExists", userAlreadyExists);

		if (userAlreadyExists) {
			return res.status(400).json({ success: false, message: "User already exists" });
		}

		const hashedPassword = await bcryptjs.hash(password, 10);
		const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

		const user = new User({
			email,
			password: hashedPassword,
			name,
			verificationToken,
			verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
		});

		await user.save();

		// jwt
		generateTokenAndSetCookie(res, user._id);

		await sendVerificationEmail({
			to: user.email,
			subject: "Verify your email",
			text: `Your verification code is: ${verificationToken}`
		});

		res.status(201).json({
			success: true,
			message: "User created successfully",
			user: {
				...user._doc,
				password: undefined,
			},
		});
	} catch (error) {
		res.status(400).json({ success: false, message: error.message });
	}
};

export const verifyEmail = async (req, res) => {
    const { code } = req.body;
    
    try {
        const user = await User.findOne({ 
            verificationToken: code ,
            verificationTokenExpiresAt: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid verification code" });
        }

        user.isverified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpire = undefined;
        await user.save();

        await sendWelcomeEmail(user.email, user.name);

        res.status(200).json({ 
            success: true, 
            message: "Email verified successfully" ,
            user: {
                ...user._doc,
                password: undefined,
            },
        });
        
    } catch (error) {
        console.log("Error verifying email", error);
        res.status(400).json({ success: false, message: error.message });
    }
    
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                 success: false,
                 message: "User not found" });
        }
        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ 
                success: false,
                message: "Invalid password" });
        }
        generateTokenAndSetCookie(res, user._id);

        user.lastlogin = Date.now();
        await user.save();
       
        res.status(200).json({ 
            success: true, 
            message: "User logged in successfully",
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    
    
    } catch (error) {
        console.log("Error logging in", error);
        res.status(400).json({ success: false, message: error.message });
    }
};
    

export const  logout = async (req, res) => {
    try {
        res.clearCookie("token" );
        res.status(200).json({ 
            success: true, 
            message: "User logged out successfully" });
    } 
    catch (error) {
        console.log("Error logging out", error);

        res.status(400).json({ 
            success: false, 
            message: error.message });
    }
}


export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ 
                success: false,
                message: "User not found" });
        }
        // generate reset token
        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetTokenExpireAt = Date.now() + 24 * 60 * 60 * 1000;

        user.resetPasswordToken = resetToken;
        user.resetPasswordTokenExpireAt = resetTokenExpireAt;
        await user.save();

        await sendPasswordResetEmail(user.email,
             `${process.env.CLIENT_URL}/reset-password/${resetToken}`);   

        
        
        res.status(200).json({ 
            success: true, 
            message: "Password reset email sent successfully" });





    } catch (error) {
        console.log("Error forgot password", error);
        res.status(400).json({ 
            success: false, 
            message: error.message });
    }
};

export const resetPassword = async (req, res) => {
    
    try {
        const { token } = req.params;
        const { password } = req.body;

        const user = await User.findOne({ 
            resetPasswordToken: token , 
            resetPasswordTokenExpireAt: { $gt: Date.now() }});



        if (!user) {
            return res.status(400).json({ 
                success: false,
                message: "User not found or token expired" 
            });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);


        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpireAt = undefined;
        await user.save();

        res.status(200).json({ 
            success: true, 
            message: "Password reset successfully" });


        generateTokenAndSetCookie(res, user._id);

        user.lastlogin = Date.now();
        await user.save();


        await sendWelcomeEmail(user.email);

        res.status(200).json({ 
            success: true, 
            message: "Password reset successfully" });

    } catch (error) {
        console.log("Error reset password", error);
        res.status(400).json({ 
            success: false, 
            message: error.message });
    }
};
    




        