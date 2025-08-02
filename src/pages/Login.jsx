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
      const { data } = await axios.post('/api/v1/users/login', values)
      setLoading(false);
      messageApi.success('Login Succesfully.')
      // localStorage.setItem('user', JSON.stringify({ ...data.user, password: '' }))
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/')
    } catch (error) {
      console.log(error.response.data);
      setLoading(false);
      messageApi.error('User Name or password is not correct');
    }
  }

  // Prevent for login user
  useEffect(() => {
    if (localStorage.getItem('user')) {
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
                    style={{ maxWidth: '100%'  }}
          onFinish={SubmitHandler}>
            <Form.Item label="Login ID" name="userName" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item label="Password" name="password" rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>

            <div className="d-flex justify-content-center mt-3">
              <button type="submit" className="btn btn-success w-100">
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