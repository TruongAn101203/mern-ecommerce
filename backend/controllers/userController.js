import userModel from "../models/userModel.js";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import e from "express";

const createToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET);
}


const getUserProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.user?.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//route for login user
const loginUser = async (req, res) => {
    try {
        const {email, password} = req.body;

        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success: false, message: "User does not exist"});
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(isMatch){
            const token = createToken(user._id);
            res.json({success: true, token});
        } else {
            res.json({success: false, message: "Invalid credentials"});
        }
    } catch (error) {
        console.log(error);
        res.json({success: false, message: "Login failed"});
    }
}

//route for register user
const registerUser = async (req, res) => {
   try {
     const {name, email, password} = req.body;

     const exists = await userModel.findOne({email});
     if(exists){
        return res.json({success: false, message: "User already exists"});
     }

     //validating email and password
        if(!validator.isEmail(email)){
            return res.json({success: false, message: "Invalid email"})
        }
        if(password.length < 8){
            return res.json({success: false, message: "Password must be at least 8 characters long"})
        }   
        //hashing password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        });
        const user = await newUser.save();

        const token = createToken(user._id);
        res.json({success: true, token});


   } catch (error) {
    console.log(error);
    res.json({success: false, message: "Registration failed"});
   }
}

//route for admin login 
const adminLogin = async (req, res) => {
    console.log('\n=== ADMIN LOGIN ATTEMPT ===');
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    console.log('Request Headers:', JSON.stringify(req.headers, null, 2));
    
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            console.error('Missing email or password');
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        
        console.log('\n=== ENVIRONMENT VARIABLES ===');
        console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL ? 'Set' : 'Not Set');
        console.log('ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? 'Set' : 'Not Set');
        console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not Set');
        
        console.log('\n=== LOGIN ATTEMPT ===');
        console.log('Provided Email:', email);
        console.log('Provided Password Length:', password ? password.length : 0);
        console.log('Expected Email:', process.env.ADMIN_EMAIL);
        console.log('Password Match:', password === process.env.ADMIN_PASSWORD);
        
        // Verify admin credentials
        if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
            console.error('\n=== INVALID CREDENTIALS ===');
            console.log('Email Match:', email === process.env.ADMIN_EMAIL);
            console.log('Password Match:', password === process.env.ADMIN_PASSWORD);
            
            return res.status(401).json({
                success: false, 
                message: "Invalid admin credentials"
            });
        }

        // Create token with admin data
        console.log('\n=== GENERATING TOKEN ===');
        const token = jwt.sign(
            { 
                email: email,
                isAdmin: true,
                iat: Math.floor(Date.now() / 1000), // Issued at time
                exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // Expires in 24 hours
            }, 
            process.env.JWT_SECRET,
            { algorithm: 'HS256' }
        );

        console.log('\n=== LOGIN SUCCESSFUL ===');
        console.log('Generated Token:', token);
        
        return res.json({
            success: true, 
            token,
            user: {
                email: email,
                isAdmin: true
            }
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false, 
            message: "Admin login failed. Please try again."
        });
    }
}


export { loginUser, registerUser, adminLogin, getUserProfile };