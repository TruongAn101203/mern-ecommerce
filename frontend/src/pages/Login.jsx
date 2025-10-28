import React, { useState, useEffect } from 'react';
import { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Login = () => {
  const [currentState, setCurrentState] = useState('Login');
  const {token, setToken, navigate, backendUrl} = useContext(ShopContext);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      if(currentState === 'Sign Up'){
        const response = await axios.post(`${backendUrl}/api/user/register`, {name, email, password});
        if(response.data.success){
          setToken(response.data.token);
          localStorage.setItem('token', response.data.token);
       
        }else{
          toast.error(response.data.message);
        }
      } else {
        const response = await axios.post(`${backendUrl}/api/user/login`, {email, password});
        console.log('Login response:', response.data); // Log response for debugging
        
        if(response.data.success && response.data.token) {
          setToken(response.data.token);
          localStorage.setItem('token', response.data.token);
          toast.success('Login successful!');
          navigate('/'); // Redirect to home page after successful login
        } else {
          const errorMessage = response.data.message || 'Login failed. Please check your credentials.';
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 
                         (error.response?.status === 401 ? 'Invalid email or password' : 'An error occurred during login');
      toast.error(errorMessage);
    }
  };
  useEffect(() => {
    if(token){
      navigate('/');
    }
  }, [token]);

  return (
    <form onSubmit={onSubmitHandler} className="flex flex-col gap-6">
      <div className="inline-flex items-center gap-2 mb-2 mt-10">
        <p className="prata-regular text-3xl">{currentState}</p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>

      {/* Ẩn ô Name khi ở trạng thái Login */}
      {currentState === 'Login' ? (
        ''
      ) : (
        <input onChange={(e)=>setName(e.target.value)} value={name}
          type="text"
          className="w-full px-3 py-2 border border-gray-800"
          placeholder="Name"
          required
        />
      )}

      <input onChange={(e)=>setEmail(e.target.value)} value={email}
        type="email"
        className="w-full px-3 py-2 border border-gray-800"
        placeholder="Email"
        required
      />
      <input onChange={(e)=>setPassword(e.target.value)} value={password}
        type="password"
        className="w-full px-3 py-2 border border-gray-800"
        placeholder="Password"
        required
      />

      <div className="w-full flex justify-between text-sm mt-[-8px]">
        <p className="cursor-pointer">Forgot your password?</p>
        {currentState === 'Login' ? (
          <p
            onClick={() => setCurrentState('Sign Up')}
            className="cursor-pointer text-blue-600"
          >
            Create account
          </p>
        ) : (
          <p
            onClick={() => setCurrentState('Login')}
            className="cursor-pointer text-blue-600"
          >
            Login Here
          </p>
        )}
      </div>

      <button className="w-full bg-gray-800 text-white py-2 rounded">
        {currentState === 'Login' ? 'Sign In' : 'Sign Up'}
      </button>
    </form>
  );
};

export default Login;
