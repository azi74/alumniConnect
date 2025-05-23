import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { MenuIcon, X, GraduationCap, Home, MessageCircle, Calendar, User, ChevronDown, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { JoinModal } from '@/components/modals/join-modal';
import { LoginModal } from '@/components/modals/login-modal';
import axios from 'axios';
import api from '@/api';
import { Loader2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: 'student' | 'alumni' | 'admin';
  profile?: {
    name: string;
    profilePhoto?: string;
    // Student fields
    registrationNumber?: string;
    year?: string;
    section?: string;
    program?: string;
    // Alumni fields
    graduationYear?: number;
    degree?: string;
    currentPosition?: string;
    company?: string;
  };
}

const NavigationBar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showAlumniForm, setShowAlumniForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Form states
  const [studentFormData, setStudentFormData] = useState({
    name: '',
    registrationNumber: '',
    email: '',
    password: '',
    year: '',
    section: '',
    program: ''
  });

  const [alumniFormData, setAlumniFormData] = useState({
    name: '',
    email: '',
    password: '',
    graduationYear: '',
    degree: '',
    currentPosition: '',
    company: ''
  });

  const [loginFormData, setLoginFormData] = useState({
    email: '',
    password: ''
  });

  // Load user from localStorage on initial render
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        
        // Fetch fresh profile data if needed
        if (parsedUser.role && !parsedUser.profile) {
          try {
            const endpoint = parsedUser.role === 'student' 
              ? '/students/me' 
              : '/alumni/me';
            
            const profileResponse = await api.get(endpoint);
            const updatedUser = {
              ...parsedUser,
              profile: profileResponse.data
            };
            
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
          } catch (error) {
            console.error("Failed to fetch profile:", error);
            setUser(parsedUser);
          }
        } else {
          setUser(parsedUser);
        }
      }
    };
    
    loadUser();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-dropdown') && !target.closest('.profile-button')) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleRoleSelect = (role: 'student' | 'alumni') => {
    setErrors({});
    setShowStudentForm(role === 'student');
    setShowAlumniForm(role === 'alumni');
  };

  // Form validation
  const validateStudentForm = () => {
    const newErrors: Record<string, string> = {};
    if (!studentFormData.name.trim()) newErrors.name = 'Name is required';
    if (!studentFormData.registrationNumber.trim()) newErrors.registrationNumber = 'Registration number is required';
    if (!studentFormData.email.trim()) newErrors.email = 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(studentFormData.email)) newErrors.email = 'Invalid email format';
    if (!studentFormData.password || studentFormData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!studentFormData.year) newErrors.year = 'Year is required';
    if (!studentFormData.section) newErrors.section = 'Section is required';
    if (!studentFormData.program) newErrors.program = 'Program is required';
    return newErrors;
  };

  const validateAlumniForm = () => {
    const newErrors: Record<string, string> = {};
    if (!alumniFormData.name.trim()) newErrors.name = 'Name is required';
    if (!alumniFormData.email.trim()) newErrors.email = 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(alumniFormData.email)) newErrors.email = 'Invalid email format';
    if (!alumniFormData.password || alumniFormData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!alumniFormData.graduationYear) newErrors.graduationYear = 'Graduation year is required';
    if (!alumniFormData.degree) newErrors.degree = 'Degree is required';
    return newErrors;
  };

  // Student registration
const handleStudentSubmit = async () => {
  const formErrors = validateStudentForm();
  if (Object.keys(formErrors).length > 0) {
    setErrors(formErrors);
    return;
  }

  setIsSubmitting(true);

  try {
    const payload = {
      name: studentFormData.name.trim(),
      email: studentFormData.email.trim(),
      password: studentFormData.password,
      role: 'student',
      profileData: {
        registrationNumber: studentFormData.registrationNumber.trim(),
        year: studentFormData.year,
        section: studentFormData.section,
        program: studentFormData.program
      }
    };

    // Make registration request
    const response = await api.post('/auth/register', payload);

    localStorage.setItem('token', response.data.token);

    // After successful registration, immediately fetch the profile
    const profileResponse = await api.get('/students/me', {
      headers: { Authorization: `Bearer ${response.data.token}` }
    });

    // Combine user and profile data
    const userData = {
      ...response.data.user,
      profile: profileResponse.data
    };

    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsJoinModalOpen(false);

    navigate('/student-portal');

  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Registration error details:', error.response.data);
      setErrors({
        form: error.response.data.message || 'Registration failed',
        ...(error.response.data.errors || {})
      });
    } else {
      setErrors({ form: 'Registration failed. Please try again.' });
    }
  } finally {
    setIsSubmitting(false);
  }
};

  // Alumni registration
const handleAlumniSubmit = async () => {
  const formErrors = validateAlumniForm();
  if (Object.keys(formErrors).length > 0) {
    setErrors(formErrors);
    return;
  }

  setIsSubmitting(true);

  try {
    // Prepare the payload in the correct format
    const payload = {
      name: alumniFormData.name.trim(),
      email: alumniFormData.email.trim(),
      password: alumniFormData.password,
      role: 'alumni',
      profileData: {
        graduationYear: Number(alumniFormData.graduationYear),
        degree: alumniFormData.degree,
        currentPosition: alumniFormData.currentPosition,
        company: alumniFormData.company
      }
    };

    // First create the user
    const response = await api.post('/auth/register', payload);

    localStorage.setItem('token', response.data.token);

    // Fetch the alumni profile after registration
    const profileResponse = await api.get('/alumni/me');
    const userData = {
      ...response.data.user,
      profile: profileResponse.data
    };

    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsJoinModalOpen(false);
    navigate('/alumni-portal');

  } catch (error: unknown) {
    console.error('Registration error:', error);
    
    let errorMessage = 'Registration failed. Please try again.';
    const fieldErrors: Record<string, string> = {};
    
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
      
      if (error.response?.status === 400 && error.response.data?.errors) {
        Object.entries(error.response.data.errors).forEach(([field, message]) => {
          if (typeof message === 'string') {
            fieldErrors[field] = message;
          }
        });
      }
    }
    
    setErrors({
      ...fieldErrors,
      form: errorMessage
    });
  } finally {
    setIsSubmitting(false);
  }
};

  // Handle registration errors
  const handleRegistrationError = (error: unknown) => {
    let errorMessage = 'Registration failed. Please try again.';
    const fieldErrors: Record<string, string> = {};

    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
      
      if (error.response?.status === 400 && error.response.data?.errors) {
        Object.entries(error.response.data.errors).forEach(([field, message]) => {
          if (typeof message === 'string') {
            fieldErrors[field] = message;
          }
        });
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    setErrors(fieldErrors.form ? fieldErrors : { ...fieldErrors, form: errorMessage });
  };

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;

    setErrors({});
    setIsLoggingIn(true);

    try {
      // 1. Authenticate user
      const response = await api.post('/auth/login', loginFormData);
      
      // 2. Fetch profile data based on role
      let profileData = {};
      if (response.data.user.role === 'student') {
        const profileResponse = await api.get('/students/me', {
          headers: { Authorization: `Bearer ${response.data.token}` }
        });
        profileData = profileResponse.data;
      } else if (response.data.user.role === 'alumni') {
        const profileResponse = await api.get('/alumni/me', {
          headers: { Authorization: `Bearer ${response.data.token}` }
        });
        profileData = profileResponse.data;
      }

      // 3. Combine user and profile data
      const userData = {
        ...response.data.user,
        profile: profileData
      };

      // 4. Store and update state
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setIsLoginModalOpen(false);

      // 5. Redirect based on role
      const redirectPath = {
        student: '/student-portal',
        alumni: '/alumni-portal',
        admin: '/admin-dashboard'
      }[userData.role] || '/';

      navigate(redirectPath, { replace: true });

    } catch (error) {
      console.error("Login error:", error);
      setErrors({
        form: axios.isAxiosError(error) 
          ? error.response?.data?.message || "Login failed"
          : "Login failed. Please try again."
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Form input handlers
  const handleFormInputChange = (formType: 'student' | 'alumni', e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (formType === 'student') {
      setStudentFormData(prev => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    } else {
      setAlumniFormData(prev => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFormSubmit = (formType: 'student' | 'alumni') => {
    if (formType === 'student') {
      handleStudentSubmit();
    } else {
      handleAlumniSubmit();
    }
  };

  const handleGoogleAuth = () => {
    console.log('Google authentication initiated');
    // Implement Google auth
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  // Reset forms when closing modal
  const resetForms = () => {
    setStudentFormData({
      name: '',
      registrationNumber: '',
      email: '',
      password: '',
      year: '',
      section: '',
      program: ''
    });
    setAlumniFormData({
      name: '',
      email: '',
      password: '',
      graduationYear: '',
      degree: '',
      currentPosition: '',
      company: ''
    });
    setErrors({});
    setShowStudentForm(false);
    setShowAlumniForm(false);
  };

  const closeJoinModal = () => {
    setIsJoinModalOpen(false);
    resetForms();
  };

  return (
    <>
      <header className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled ? 'bg-white/80 backdrop-blur-md border-b border-phthalo-light/50 py-3' : 'bg-transparent py-5'
      )}>
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-8 w-8 text-phthalo" />
            <span className="font-semibold text-xl text-phthalo">AlumniConnect</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-medium transition-colors hover:text-phthalo flex items-center gap-1">
              <Home className="h-4 w-4" /> Home
            </Link>
            <Link to="/ai-chat" className="text-sm font-medium transition-colors hover:text-phthalo flex items-center gap-1">
              <MessageCircle className="h-4 w-4" /> AI Assistant
            </Link>
            <Link to="/events" className="text-sm font-medium transition-colors hover:text-phthalo flex items-center gap-1">
              <Calendar className="h-4 w-4" /> Events
            </Link>
          </nav>

          {/* Action buttons */}
          {user ? (
            <div className="flex items-center space-x-4 relative">
              <div className="flex items-center space-x-2">
                <button 
                  className="profile-button flex items-center space-x-2 focus:outline-none"
                  onClick={toggleProfileDropdown}
                >
                  <div className="relative">
                    {user.profile?.profilePhoto ? (
                      <img 
                        src={user.profile.profilePhoto} 
                        alt="Profile" 
                        className="h-8 w-8 rounded-full object-cover border-2 border-phthalo"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-phthalo flex items-center justify-center text-white">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                  <ChevronDown className={`h-4 w-4 text-phthalo transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Profile Dropdown */}
              {isProfileDropdownOpen && (
                <div className="profile-dropdown absolute right-0 top-12 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user.profile?.name || 'User'}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to={user.role === 'student' ? '/student-profile' : '/alumni-profile'}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      Settings
                    </Link>
                  </div>
                  <div className="py-1 border-t border-gray-200">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsLoginModalOpen(true)}
                className="button-transition button-hover focus-ring border-phthalo-medium/50 text-phthalo hover:text-phthalo-dark"
              >
                Login
              </Button>
              <Button 
                onClick={() => setIsJoinModalOpen(true)}
                className="button-transition button-hover focus-ring bg-phthalo hover:bg-phthalo-dark"
              >
                Join Now
              </Button>
            </>
          )}

          {/* Mobile menu button */}
          <button 
            className="md:hidden focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6 text-phthalo" /> : <MenuIcon className="h-6 w-6 text-phthalo" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md border-b border-phthalo-light/50 animate-fade-in">
            <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
              <Link 
                to="/" 
                className="py-2 text-base font-medium transition-colors hover:text-phthalo flex items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="h-4 w-4" /> Home
              </Link>
              <Link 
                to="/ai-chat" 
                className="py-2 text-base font-medium transition-colors hover:text-phthalo flex items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <MessageCircle className="h-4 w-4" /> AI Assistant
              </Link>
              <Link 
                to="/events" 
                className="py-2 text-base font-medium transition-colors hover:text-phthalo flex items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Calendar className="h-4 w-4" /> Events
              </Link>
              <div className="pt-2 flex flex-col space-y-3">
                {user ? (
                  <>
                    <div className="flex items-center space-x-3 px-2">
                      {user.profile?.profilePhoto ? (
                        <img 
                          src={user.profile.profilePhoto} 
                          alt="Profile" 
                          className="h-8 w-8 rounded-full object-cover border-2 border-phthalo"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-phthalo flex items-center justify-center text-white">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{user.profile?.name || 'User'}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                      </div>
                    </div>
                    <Link
                      to={user.role === 'student' ? '/student-profile' : '/alumni-profile'}
                      className="py-2 text-base font-medium transition-colors hover:text-phthalo flex items-center gap-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="py-2 text-base font-medium transition-colors hover:text-phthalo flex items-center gap-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <Button 
                      variant="outline"
                      className="w-full justify-center button-transition focus-ring text-red-600 border-red-300 hover:text-red-800 flex items-center gap-2"
                      onClick={() => {
                        handleLogout();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline"
                      className="w-full justify-center button-transition focus-ring border-phthalo-medium/50 text-phthalo hover:text-phthalo-dark"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsLoginModalOpen(true);
                      }}
                    >
                      Login
                    </Button>
                    <Button 
                      className="w-full justify-center button-transition focus-ring bg-phthalo hover:bg-phthalo-dark"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsJoinModalOpen(true);
                      }}
                    >
                      Join Now
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Modal components */}
      <JoinModal
        isOpen={isJoinModalOpen}
        onClose={closeJoinModal}
        onRoleSelect={handleRoleSelect}
        showStudentForm={showStudentForm}
        showAlumniForm={showAlumniForm}
        studentFormData={studentFormData}
        alumniFormData={alumniFormData}
        onFormInputChange={handleFormInputChange}
        onFormSubmit={handleFormSubmit}
        onGoogleAuth={handleGoogleAuth}
        errors={errors}
        isSubmitting={isSubmitting}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          setErrors({});
        }}
        formData={loginFormData}
        onInputChange={handleLoginInputChange}
        onSubmit={handleLoginSubmit}
        error={errors.form}
        isLoading={isLoggingIn}
      />
    </>
  );
};

export default NavigationBar;