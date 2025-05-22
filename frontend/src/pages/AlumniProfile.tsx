import React, { useState, useEffect } from 'react';
import NavigationBar from '@/components/NavigationBar';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import api from '@/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, GraduationCap, Edit, MapPin, Mail, Phone, Globe, Linkedin as LinkedinIcon, Users as UsersIcon, Check, Plus, Trash } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Education {
  institution: string;
  degree: string;
  year: string;
  description?: string;
}

interface WorkExperience {
  company: string;
  role: string;
  duration: string;
  description?: string;
}

interface AlumniProfileData {
  graduationYear: string;
  degree: string;
  currentCompany: string;
  currentRole: string;
  location: string;
  skills: string[];
  education: Education[];
  workExperience: WorkExperience[];
}

const AlumniProfile = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(authUser);
  const [alumniData, setAlumniData] = useState<AlumniProfileData | null>(null);
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const [formData, setFormData] = useState({
    // User fields
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    profilePhoto: user?.profilePhoto || '',
    socialLinks: user?.socialLinks || { linkedin: '', website: '' },
    
    // Alumni fields
    graduationYear: '',
    degree: '',
    currentCompany: '',
    currentRole: '',
    location: '',
    skills: [] as string[],
    education: [] as Education[],
    workExperience: [] as WorkExperience[],
  });

  // Error message helper function
  const getErrorMessage = (error: unknown): string => {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && error !== null) {
      const apiError = error as {
        response?: {
          data?: {
            error?: string;
            message?: string;
          };
        };
        message?: string;
      };
      return apiError.response?.data?.error || 
             apiError.response?.data?.message || 
             apiError.message || 
             'An unknown error occurred';
    }
    return 'An unknown error occurred';
  }

  // Calculate profile completion percentage
  const calculateCompletion = (): number => {
    const requiredFields = ['graduationYear', 'degree', 'currentRole'];
    const completedFields = requiredFields.filter(field => {
      const value = formData[field as keyof typeof formData];
      return value && value.toString().trim() !== '';
    });
    return (completedFields.length / requiredFields.length) * 100;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const completionPercentage = calculateCompletion();
      
      // Split data into user and alumni parts
      const alumniData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio,
        socialLinks: formData.socialLinks,
        graduationYear: formData.graduationYear,
        degree: formData.degree,
        currentCompany: formData.currentCompany,
        currentRole: formData.currentRole,
        location: formData.location,
        skills: formData.skills,
        education: formData.education,
        workExperience: formData.workExperience,
        profileComplete: completionPercentage === 100
    };

    const response = await api.put('/alumni/me', alumniData);
    
    if (!response.data?.success) {
      throw new Error(response.data?.error || 'Update failed');
    }

      // Refresh data
      const [userResponse, alumniResponse] = await Promise.all([
        api.get('/auth/me'),
        api.get('/alumni/me')
      ]);

      // Update state
      const updatedUser = {
      ...userResponse.data.data,
      ...alumniResponse.data.data,
      socialLinks: alumniResponse.data.data?.socialLinks || 
                 userResponse.data.data?.socialLinks || 
                 { linkedin: '', website: '' }
    };

    setUser(updatedUser);
    setAlumniData(updatedUser);
    setFormData(updatedUser);
    setPreviewUrl(updatedUser.profilePhoto || '');
    localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setIsEditMode(false);
      toast.success('Profile updated successfully!');
      
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error('Update error:', error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...(prev.socialLinks || { linkedin: '', website: '' }),
        [platform]: value
      }
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfilePhoto = async () => {
    if (!selectedFile) return;
    
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('profilePhoto', selectedFile);

      const response = await api.put('/auth/upload-profile-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data?.success) {
        // Get fresh data after upload
        const userResponse = await api.get('/auth/me');
        const alumniResponse = await api.get('/alumni/me');

        const updatedUser = {
          ...userResponse.data.data?.user,
          ...userResponse.data.data?.profile,
          profileComplete: calculateCompletion() === 100
        };

        setUser(updatedUser);
        setPreviewUrl(updatedUser.profilePhoto || '');
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        toast.success('Profile photo updated successfully!');
      }
    } catch (error) {
      toast.error('Failed to upload profile photo');
      console.error('Upload error:', error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleAddEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, {
        institution: '',
        degree: '',
        year: '',
        description: ''
      }]
    }));
  };

  const handleEducationChange = (index: number, field: string, value: string) => {
    const updatedEducation = [...formData.education];
    updatedEducation[index] = {
      ...updatedEducation[index],
      [field]: value
    };
    setFormData(prev => ({ ...prev, education: updatedEducation }));
  };

  const handleRemoveEducation = (index: number) => {
    const updatedEducation = [...formData.education];
    updatedEducation.splice(index, 1);
    setFormData(prev => ({ ...prev, education: updatedEducation }));
  };

  const handleAddExperience = () => {
    setFormData(prev => ({
      ...prev,
      workExperience: [...prev.workExperience, {
        company: '',
        role: '',
        duration: '',
        description: ''
      }]
    }));
  };

  const handleExperienceChange = (index: number, field: string, value: string) => {
    const updatedExperience = [...formData.workExperience];
    updatedExperience[index] = {
      ...updatedExperience[index],
      [field]: value
    };
    setFormData(prev => ({ ...prev, workExperience: updatedExperience }));
  };

  const handleRemoveExperience = (index: number) => {
    const updatedExperience = [...formData.workExperience];
    updatedExperience.splice(index, 1);
    setFormData(prev => ({ ...prev, workExperience: updatedExperience }));
  };

  // Initialize form data when component mounts or user changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, alumniResponse] = await Promise.all([
          api.get('/auth/me'),
          api.get('/alumni/me')
        ]);

        console.log("User response:", userResponse.data);
        console.log("Alumni response:", alumniResponse.data);

        const mergedData = {
        ...userResponse.data.data,
        ...alumniResponse.data.data,
        socialLinks: alumniResponse.data.data?.socialLinks || 
                   userResponse.data.data?.socialLinks || 
                   { linkedin: '', website: '' }
      };

      setUser(mergedData);
      setAlumniData(mergedData);
      setFormData(mergedData);

      // Set profile photo if available
      if (mergedData?.profilePhoto) {
        setPreviewUrl(mergedData.profilePhoto);
      }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load profile data');
      }
    };

    if (authUser?.role === 'alumni') {
      fetchData();
    }
  }, [authUser]);

  // Reset form data when exiting edit mode
  useEffect(() => {
    if (user && alumniData && !isEditMode) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        profilePhoto: user.profilePhoto || '',
        socialLinks: user.socialLinks || { linkedin: '', website: '' },
        graduationYear: alumniData.graduationYear || '',
        degree: alumniData.degree || '',
        currentCompany: alumniData.currentCompany || '',
        currentRole: alumniData.currentRole || '',
        location: alumniData.location || '',
        skills: alumniData.skills || [],
        education: alumniData.education || [],
        workExperience: alumniData.workExperience || [],
      });
    }
  }, [user, alumniData, isEditMode]);

  // Automatically enter edit mode if profile is incomplete
  useEffect(() => {
    if (user && !user.profileComplete) {
      setIsEditMode(true);
    }
  }, [user]);

  const ProfileForm = () => {
    const socialLinks = formData.socialLinks || { linkedin: '', website: '' };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Professional Information Section */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Professional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentRole">Current Role*</Label>
              <Input
                id="currentRole"
                name="currentRole"
                value={formData.currentRole}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentCompany">Current Company</Label>
              <Input
                id="currentCompany"
                name="currentCompany"
                value={formData.currentCompany}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                type="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="graduationYear">Graduation Year*</Label>
              <Input
                id="graduationYear"
                name="graduationYear"
                value={formData.graduationYear}
                onChange={handleChange}
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="degree">Degree*</Label>
              <Input
                id="degree"
                name="degree"
                value={formData.degree}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </Card>

        {/* About Me Section */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">About Me</h3>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              placeholder="Tell us about your professional journey, expertise, and interests..."
            />
          </div>
        </Card>

        {/* Skills Section */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Skills & Expertise</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {['JavaScript', 'React', 'Node.js', 'Python', 'Java', 'Cloud Computing', 
              'Project Management', 'Data Analysis', 'UI/UX Design', 'Machine Learning'].map((skill) => (
              <Badge
                key={skill}
                variant={formData.skills.includes(skill) ? 'default' : 'secondary'}
                onClick={() => handleSkillToggle(skill)}
                className="cursor-pointer"
              >
                {skill}
                {formData.skills.includes(skill) && <Check className="h-3 w-3 ml-1" />}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Add custom skill"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  handleSkillToggle(e.currentTarget.value.trim());
                  e.currentTarget.value = '';
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                if (input.value.trim()) {
                  handleSkillToggle(input.value.trim());
                  input.value = '';
                }
              }}
            >
              Add
            </Button>
          </div>
        </Card>

        {/* Education Background Section */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Education Background</h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleAddEducation}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Education
            </Button>
          </div>
          <div className="space-y-4">
            {formData.education.map((edu, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`education-institution-${index}`}>Institution</Label>
                  <Input
                    id={`education-institution-${index}`}
                    value={edu.institution}
                    onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                    placeholder="University Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`education-degree-${index}`}>Degree</Label>
                  <Input
                    id={`education-degree-${index}`}
                    value={edu.degree}
                    onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                    placeholder="Degree Earned"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`education-year-${index}`}>Year</Label>
                  <Input
                    id={`education-year-${index}`}
                    value={edu.year}
                    onChange={(e) => handleEducationChange(index, 'year', e.target.value)}
                    placeholder="Graduation Year"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveEducation(index)}
                    className="h-10 w-10"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Work Experience Section */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Work Experience</h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleAddExperience}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Experience
            </Button>
          </div>
          <div className="space-y-4">
            {formData.workExperience.map((exp, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`experience-company-${index}`}>Company</Label>
                  <Input
                    id={`experience-company-${index}`}
                    value={exp.company}
                    onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                    placeholder="Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`experience-role-${index}`}>Role</Label>
                  <Input
                    id={`experience-role-${index}`}
                    value={exp.role}
                    onChange={(e) => handleExperienceChange(index, 'role', e.target.value)}
                    placeholder="Job Title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`experience-duration-${index}`}>Duration</Label>
                  <Input
                    id={`experience-duration-${index}`}
                    value={exp.duration}
                    onChange={(e) => handleExperienceChange(index, 'duration', e.target.value)}
                    placeholder="e.g. 2020 - Present"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveExperience(index)}
                    className="h-10 w-10"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Social Links Section */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Social Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                name="linkedin"
                value={socialLinks.linkedin}
                onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Personal Website</Label>
              <Input
                id="website"
                name="website"
                value={socialLinks.website}
                onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => setIsEditMode(false)}
            type="button"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : 'Save Profile'}
          </Button>
        </div>
      </form>
    );
  };

  const renderProfileView = () => {
    if (!user || !alumniData) return null;

    const skills = alumniData.skills || [];
    const education = alumniData.education || [];
    const workExperience = alumniData.workExperience || [];
    const socialLinks = user.socialLinks || { linkedin: '', website: '' };

    return (
      <>
        <div className="mb-8 relative">
          <div className="h-48 rounded-xl overflow-hidden mb-16">
            <img 
              src="https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070&auto=format&fit=crop" 
              alt="Profile Banner" 
              className="w-full h-full object-cover"
            />
          </div>
        
          <div className="absolute left-8 bottom-0 transform translate-y-1/2 flex flex-col sm:flex-row items-start sm:items-end gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-100 overflow-hidden">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt={user.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                    <UsersIcon className="h-10 w-10" />
                  </div>
               )}
              </div>            
              <label 
                htmlFor="profile-photo-upload"
                className="absolute bottom-0 right-0 rounded-full bg-white p-2 shadow-md cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <Edit className="h-4 w-4" />
                <input
                  id="profile-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>    
              {selectedFile && (
                <div className="absolute -bottom-10 left-0 right-0 flex justify-center">
                  <Button
                    size="sm"
                    onClick={uploadProfilePhoto}
                    disabled={uploadingPhoto}
                    className="text-xs"
                  >
                    {uploadingPhoto ? 'Uploading...' : 'Save Photo'}
                  </Button>
                </div>
              )}
            </div>
            <div className="sm:mb-4">
              <h1 className="text-2xl md:text-3xl font-bold">{user.name}</h1>
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                {alumniData.degree && alumniData.graduationYear && (
                  <>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      {alumniData.degree}, Class of {alumniData.graduationYear}
                    </span>
                    <span className="hidden sm:inline">•</span>
                  </>
                )}
                {alumniData.currentRole && alumniData.currentCompany && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {alumniData.currentRole} at {alumniData.currentCompany}
                  </span>
                )}
              </div>
            </div>
          </div>      
          <div className="flex justify-end gap-3 mt-4">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              asChild
            >
              <Link to="/alumni-portal">
                <Briefcase className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button 
              className="flex items-center gap-2"
              onClick={() => setIsEditMode(true)}
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email || 'Not provided'}</p>
                  </div>
                </div>
              
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{user.phone}</p>
                    </div>
                  </div>
                )}
              
                {alumniData.location && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{alumniData.location}</p>
                    </div>
                  </div>
                )}
              </div>
            
              {(user.socialLinks?.linkedin || user.socialLinks?.website) && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="text-sm font-semibold mb-3">Social Media</h4>
                  <div className="flex gap-2">
                    {user.socialLinks.linkedin && (
                      <Button size="icon" variant="outline" asChild>
                        <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                          <LinkedinIcon className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {user.socialLinks.website && (
                      <Button size="icon" variant="outline" asChild>
                        <a href={user.socialLinks.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          
            {skills.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Skills & Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-4 w-full"
                  onClick={() => setIsEditMode(true)}
                >
                  <Edit className="h-3 w-3 mr-2" />
                  Edit Skills
                </Button>
              </Card>
            )}
          </div>
        
          <div className="lg:col-span-2 space-y-6">
            {user.bio && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">About Me</h3>
                <p className="text-muted-foreground whitespace-pre-line">{user.bio}</p>
              </Card>
            )}
          
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Education Background
              </h3>
              {education.length > 0 ? (
                education.map((edu, index) => (
                  <div key={index} className="border-l-2 border-primary/30 pl-4 ml-2 relative mb-4">
                    <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1"></div>
                    <div className="mb-1">
                      <h4 className="text-base font-semibold">{edu.degree}</h4>
                      <p className="text-muted-foreground">{edu.institution}</p>
                      <p className="text-sm text-muted-foreground">{edu.year}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No education information added yet.</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setIsEditMode(true)}
                  >
                    Add Education
                  </Button>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Work Experience
              </h3>
              {workExperience.length > 0 ? (
                workExperience.map((exp, index) => (
                  <div key={index} className="border-l-2 border-primary/30 pl-4 ml-2 relative mb-4">
                    <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1"></div>
                    <div className="mb-1">
                      <h4 className="text-base font-semibold">{exp.role}</h4>
                      <p className="text-muted-foreground">{exp.company}</p>
                      <p className="text-sm text-muted-foreground">{exp.duration}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No work experience added yet.</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setIsEditMode(true)}
                  >
                    Add Experience
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </>
    );
  };

  const renderProfileContent = () => {

    console.log("Render conditions:", {
      user: !!user,
      alumniData: !!alumniData,
      isEditMode,
      profileComplete: user?.profileComplete
    });

    if (!user || !alumniData) {
      return (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      );
    }

    if (isEditMode || !user.profileComplete) {
      return <ProfileForm />;
    }

    return renderProfileView();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4 md:px-6">
          {renderProfileContent()}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AlumniProfile;