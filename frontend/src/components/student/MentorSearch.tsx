import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Users, Star, X, GraduationCap, Briefcase, Mail, Phone, MapPin, Globe, Linkedin as LinkedinIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/api';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Alumni {
  _id: string;
  name: string;
  email: string;
  profilePhoto?: string;
  graduationYear: number;
  degree: string;
  currentRole: string;
  currentCompany: string;
  location: string;
  skills: string[];
  bio?: string;
  education?: Array<{
    institution: string;
    degree: string;
    year: string;
    description?: string;
  }>;
  workExperience?: Array<{
    company: string;
    role: string;
    duration: string;
    description?: string;
  }>;
  socialLinks?: {
    linkedin?: string;
    website?: string;
  };
}

const MentorSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const fetchAlumni = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/alumni');
        setAlumni(response.data.data);
      } catch (error) {
        console.error('Failed to fetch alumni:', error);
        setError('Failed to load alumni data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAlumni();
  }, []);

  const filteredAlumni = alumni.filter(alumnus => 
    alumnus.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumnus.currentRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (alumnus.skills && alumnus.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))) ||
    alumnus.currentCompany.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewProfile = (alumnus: Alumni) => {
    setSelectedAlumni(alumnus);
    setIsProfileModalOpen(true);
  };

  const handleStartChat = (alumniId: string) => {
    navigate('/student-portal?tab=chat', { state: { alumniId } });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center p-4">
          <p className="text-red-500 mb-2">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alumni Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Alumni Profile</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsProfileModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          {selectedAlumni && (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-100 overflow-hidden shadow-md">
                  {selectedAlumni.profilePhoto ? (
                    <img 
                      src={selectedAlumni.profilePhoto} 
                      alt={selectedAlumni.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                      <Users className="h-10 w-10" />
                    </div>
                  )}
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold">{selectedAlumni.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 text-muted-foreground mt-1">
                    {selectedAlumni.degree && selectedAlumni.graduationYear && (
                      <>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="h-4 w-4" />
                          {selectedAlumni.degree}, Class of {selectedAlumni.graduationYear}
                        </span>
                        <span className="hidden sm:inline">•</span>
                      </>
                    )}
                    {selectedAlumni.currentRole && selectedAlumni.currentCompany && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {selectedAlumni.currentRole} at {selectedAlumni.currentCompany}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Contact Info and Skills */}
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
                          <p className="font-medium">{selectedAlumni.email || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      {selectedAlumni.location && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Location</p>
                            <p className="font-medium">{selectedAlumni.location}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {(selectedAlumni.socialLinks?.linkedin || selectedAlumni.socialLinks?.website) && (
                      <div className="mt-6 pt-4 border-t">
                        <h4 className="text-sm font-semibold mb-3">Social Media</h4>
                        <div className="flex gap-2">
                          {selectedAlumni.socialLinks.linkedin && (
                            <Button size="icon" variant="outline" asChild>
                              <a href={selectedAlumni.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                                <LinkedinIcon className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          {selectedAlumni.socialLinks.website && (
                            <Button size="icon" variant="outline" asChild>
                              <a href={selectedAlumni.socialLinks.website} target="_blank" rel="noopener noreferrer">
                                <Globe className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                  
                  {selectedAlumni.skills && selectedAlumni.skills.length > 0 && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Skills & Expertise</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedAlumni.skills.map((skill) => (
                          <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
                
                {/* Right Column - Bio, Education, Experience */}
                <div className="lg:col-span-2 space-y-6">
                  {selectedAlumni.bio && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">About Me</h3>
                      <p className="text-muted-foreground whitespace-pre-line">{selectedAlumni.bio}</p>
                    </Card>
                  )}
                  
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      Education Background
                    </h3>
                    {selectedAlumni.education && selectedAlumni.education.length > 0 ? (
                      selectedAlumni.education.map((edu, index) => (
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
                        <p>No education information available.</p>
                      </div>
                    )}
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Work Experience
                    </h3>
                    {selectedAlumni.workExperience && selectedAlumni.workExperience.length > 0 ? (
                      selectedAlumni.workExperience.map((exp, index) => (
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
                        <p>No work experience available.</p>
                      </div>
                    )}
                  </Card>
                </div>
              </div>
              
              <div className="flex justify-end gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsProfileModalOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    handleStartChat(selectedAlumni._id);
                  }}
                >
                  Start Chat
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Main Search Content */}
      <Card className="glass-card p-6 rounded-xl animate-fade-in">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Alumni Network
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pt-2 pb-0">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, role, skills, company..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAlumni.map(alumnus => (
              <div 
                key={alumnus._id}
                className="border rounded-lg overflow-hidden hover:border-primary/30 transition-all duration-300 glass-card hover:shadow-md"
              >
                <div className="flex p-4">
                  <div className="w-16 h-16 mr-4 rounded-full overflow-hidden flex-shrink-0">
                    {alumnus.profilePhoto ? (
                      <img 
                        src={alumnus.profilePhoto}
                        alt={alumnus.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <Users className="h-8 w-8 text-gray-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{alumnus.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {alumnus.currentRole} at {alumnus.currentCompany}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <Star className="h-3 w-3 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium">4.8</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {alumnus.skills?.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-slate-100">
                          {skill}
                        </Badge>
                      ))}
                      {alumnus.skills && alumnus.skills.length > 3 && (
                        <Badge variant="secondary" className="text-xs bg-slate-100">
                          +{alumnus.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-xs flex-1"
                        onClick={() => handleViewProfile(alumnus)}
                      >
                        View Profile
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-7 text-xs flex-1"
                        onClick={() => handleStartChat(alumnus._id)}
                      >
                        Chat
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredAlumni.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No alumni found matching your search criteria.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => setSearchTerm('')}
              >
                Clear search
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MentorSearch;