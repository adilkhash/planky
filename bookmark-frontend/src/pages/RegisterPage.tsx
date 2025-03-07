import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const RegisterPage: React.FC = () => {
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      email: '',
      username: '',
      password: '',
      password_confirm: '',
      first_name: '',
      last_name: '',
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      username: Yup.string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be 30 characters or less'),
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
      password_confirm: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Password confirmation is required'),
      first_name: Yup.string()
        .max(30, 'First name must be 30 characters or less'),
      last_name: Yup.string()
        .max(30, 'Last name must be 30 characters or less'),
    }),
    onSubmit: async (values) => {
      try {
        await register(values.email, values.username, values.password, values.password_confirm);
        navigate('/');
      } catch {
        // Error is handled in AuthContext
      }
    },
  });

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Create a Planky Account</h1>

          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4 whitespace-pre-line">
              {error}
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                {...formik.getFieldProps('email')}
                className={`input w-full ${
                  formik.touched.email && formik.errors.email ? 'border-red-500' : ''
                }`}
              />
              {formik.touched.email && formik.errors.email ? (
                <div className="text-red-500 text-sm mt-1">{formik.errors.email}</div>
              ) : null}
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                {...formik.getFieldProps('username')}
                className={`input w-full ${
                  formik.touched.username && formik.errors.username ? 'border-red-500' : ''
                }`}
              />
              {formik.touched.username && formik.errors.username ? (
                <div className="text-red-500 text-sm mt-1">{formik.errors.username}</div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  id="first_name"
                  type="text"
                  {...formik.getFieldProps('first_name')}
                  className={`input w-full ${
                    formik.touched.first_name && formik.errors.first_name ? 'border-red-500' : ''
                  }`}
                />
                {formik.touched.first_name && formik.errors.first_name ? (
                  <div className="text-red-500 text-sm mt-1">{formik.errors.first_name}</div>
                ) : null}
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  id="last_name"
                  type="text"
                  {...formik.getFieldProps('last_name')}
                  className={`input w-full ${
                    formik.touched.last_name && formik.errors.last_name ? 'border-red-500' : ''
                  }`}
                />
                {formik.touched.last_name && formik.errors.last_name ? (
                  <div className="text-red-500 text-sm mt-1">{formik.errors.last_name}</div>
                ) : null}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                {...formik.getFieldProps('password')}
                className={`input w-full ${
                  formik.touched.password && formik.errors.password ? 'border-red-500' : ''
                }`}
              />
              {formik.touched.password && formik.errors.password ? (
                <div className="text-red-500 text-sm mt-1">{formik.errors.password}</div>
              ) : null}
            </div>

            <div>
              <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password_confirm"
                type="password"
                {...formik.getFieldProps('password_confirm')}
                className={`input w-full ${
                  formik.touched.password_confirm && formik.errors.password_confirm ? 'border-red-500' : ''
                }`}
              />
              {formik.touched.password_confirm && formik.errors.password_confirm ? (
                <div className="text-red-500 text-sm mt-1">{formik.errors.password_confirm}</div>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full flex justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : (
                'Register'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;
