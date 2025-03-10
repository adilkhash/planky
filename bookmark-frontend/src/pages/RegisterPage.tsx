import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const RegisterPage: React.FC = () => {
  const { register, loading, error, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

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
        .email('Please enter a valid email address')
        .required('Email is required'),
      username: Yup.string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be 30 characters or less')
        .matches(/^[a-zA-Z0-9_]*$/, 'Username can only contain letters, numbers, and underscores'),
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
          'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        )
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
        // redirect handled in useEffect
      } catch (err) {
        // Error is handled in AuthContext
      }
    },
  });

  // Function to check password strength
  const getPasswordStrength = (password: string): { strength: string; color: string } => {
    if (!password) return { strength: 'None', color: 'text-gray-400' };

    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Complexity checks
    if (/[A-Z]/.test(password)) score += 1; // uppercase
    if (/[a-z]/.test(password)) score += 1; // lowercase
    if (/[0-9]/.test(password)) score += 1; // numbers
    if (/[^A-Za-z0-9]/.test(password)) score += 1; // special chars

    // Return strength rating
    if (score < 3) return { strength: 'Weak', color: 'text-red-500' };
    if (score < 5) return { strength: 'Moderate', color: 'text-yellow-500' };
    return { strength: 'Strong', color: 'text-green-500' };
  };

  const passwordStrength = getPasswordStrength(formik.values.password);

  // Clear error when user starts typing
  useEffect(() => {
    if (error && Object.values(formik.values).some(value => value)) {
      clearError();
    }
  }, [formik.values, error, clearError]);

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Create a Planky Account</h1>

          {error && (
            <div className="bg-red-50 text-red-800 p-4 rounded-md mb-4 flex items-start">
              <ExclamationCircleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="whitespace-pre-line">{error}</div>
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
                placeholder="your@email.com"
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
                placeholder="username"
              />
              {formik.touched.username && formik.errors.username ? (
                <div className="text-red-500 text-sm mt-1">{formik.errors.username}</div>
              ) : null}
              {formik.values.username && !formik.errors.username && (
                <div className="text-green-500 text-sm mt-1 flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Username is available
                </div>
              )}
              <div className="text-gray-500 text-xs mt-1">
                Username is optional. You can use your email to login.
              </div>
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
                  placeholder="John"
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
                  placeholder="Doe"
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
                placeholder="••••••••"
              />
              {formik.touched.password && formik.errors.password ? (
                <div className="text-red-500 text-sm mt-1">{formik.errors.password}</div>
              ) : formik.values.password ? (
                <div className={`${passwordStrength.color} text-sm mt-1 flex items-center`}>
                  Password strength: {passwordStrength.strength}
                </div>
              ) : null}
              <div className="text-gray-500 text-xs mt-1">
                Password must be at least 8 characters and include uppercase, lowercase, and numbers.
              </div>
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
                placeholder="••••••••"
              />
              {formik.touched.password_confirm && formik.errors.password_confirm ? (
                <div className="text-red-500 text-sm mt-1">{formik.errors.password_confirm}</div>
              ) : formik.values.password_confirm && formik.values.password === formik.values.password_confirm ? (
                <div className="text-green-500 text-sm mt-1 flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Passwords match
                </div>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={loading || formik.isSubmitting}
              className="btn btn-primary w-full flex justify-center items-center"
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
