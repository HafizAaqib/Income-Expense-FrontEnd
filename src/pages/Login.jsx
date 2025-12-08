// rafce

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { Form, Input, message } from 'antd';
import axios from 'axios';
import Password from 'antd/es/input/Password';
import Spinner from '../components/Spinner';
import './login.css';

const Login = () => {

  const [messageApi, msgContextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const SubmitHandler = async (values) => {
    try {
      setLoading(true);
      const API = import.meta.env.VITE_API_BASE_URL;
      const { data } = await axios.post(`${API}/users/login`, values, {
        headers: {
          "X-Client": window.location.hostname.split(".")[0] ,
        },
      });

      setLoading(false);
      messageApi.success('Login Successfully.');

      localStorage.setItem('user', JSON.stringify(data.user));
      //navigate('/');
      if (data.user?.canViewOtherUsersData) {
        navigate('/');  // dashboard
      } else {
        navigate('/income'); // direct to income if can't view dashboard
      }
    } catch (error) {
      setLoading(false);

      console.error('Login Error:', error.response?.data || error.message);

      if (error.response?.data) {
        messageApi.error(error.response.data); // e.g. "Login ID or Password is not correct"
      } else {
        messageApi.error('Login failed. Please try again.');
      }
    }

  }

  // Prevent for login user
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const user = storedUser ? JSON.parse(storedUser) : null;
    console.log('login page :- user : ' , user)
    if (user && user.userName && user._id) {
      navigate('/');
    }
  }, [navigate]);

  return (

    <>
      {msgContextHolder}
      <div className="login-wrapper d-flex align-items-center justify-content-center">
        {/* <div className="login-box shadow p-4 rounded bg-white d-flex align-items-center justify-content-center flex-direction-column">
*/}{/* height : 317px */}{/*
  <h2 className="text-center text-success mb-4">Income & Expense Management</h2>
  <img src='../public/icons8-cash-96.png'></img>
</div> */}
        <div className="login-box shadow p-4 rounded bg-white">
          {loading && <Spinner />}
          {!loading && <h2 className="text-center text-success mb-4">Login</h2>}
          <Form
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            style={{ maxWidth: '100%' }}
            onFinish={SubmitHandler}>
            <Form.Item label="Login ID" name="userName" rules={[{ required: true , message:'Login ID is required' }]}>
              <Input />
            </Form.Item>

            <Form.Item label="Password" name="password" rules={[{ required: true , message : 'Password is required' }]}>
              <Input.Password />
            </Form.Item>

            <div className="d-flex justify-content-center mt-3">
              <button type="submit" className="btn btn-success w-100"
              style={{ backgroundColor: "#029bd2", borderColor: "#029bd2" }}>
                Login
              </button>
            </div>

          </Form>
        </div>
      </div>
    </>
  );

};

export default Login