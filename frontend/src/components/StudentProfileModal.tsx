import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  LinkedinIcon, 
  GraduationCap,
  Award,
  Users as UsersIcon
} from 'lucide-react';

interface StudentProfileModalProps {
  student: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    program?: string;
    year?: string;
    section?: string;
    bio?: string;
    interests?: string[];
    image?: string;
    socialLinks?: {
      linkedin?: string;
      website?: string;
    };
    achievements?: Array<{
      title: string;
      description?: string;
      date?: string;
    }>;
    gpa?: string;
  };
  onClose: () => void;
}

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ student, onClose }) => {
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-100 overflow-hidden">
          <img 
            src={student.image || '/default-user.png'} 
            alt={student.name} 
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{student.name}</h2>
          {student.program && (
            <p className="text-muted-foreground">
              {student.program} - {student.year ? `Year ${student.year}` : ''}
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Contact Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              <div className="space-y-3">
                {student.email && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{student.email}</p>
                    </div>
                  </div>
                )}

                {student.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{student.phone}</p>
                    </div>
                  </div>
                )}

                {student.address && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="font-medium">{student.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {(student.socialLinks?.linkedin || student.socialLinks?.website) && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="text-sm font-semibold mb-3">Social Media</h4>
                  <div className="flex gap-2">
                    {student.socialLinks.linkedin && (
                      <a 
                        href={student.socialLinks.linkedin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                      >
                        <LinkedinIcon className="h-4 w-4" />
                      </a>
                    )}
                    {student.socialLinks.website && (
                      <a 
                        href={student.socialLinks.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interests */}
          {student.interests?.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {student.interests.map((interest, index) => (
                    <Badge key={index} variant="secondary">{interest}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievements */}
          {student.achievements?.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Achievements
                </h3>
                <div className="space-y-4">
                  {student.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Award className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium">{achievement.title}</p>
                        {achievement.description && <p className="text-sm">{achievement.description}</p>}
                        {achievement.date && <p className="text-sm text-muted-foreground">{achievement.date}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          {student.bio && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">About</h3>
                <p className="text-muted-foreground whitespace-pre-line">{student.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Academic Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Academic Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {student.program && (
                  <div>
                    <p className="text-sm text-muted-foreground">Program</p>
                    <p className="font-medium">{student.program}</p>
                  </div>
                )}
                {student.year && (
                  <div>
                    <p className="text-sm text-muted-foreground">Year</p>
                    <p className="font-medium">
                      {student.year === '1' ? 'First Year' : 
                       student.year === '2' ? 'Second Year' : 
                       student.year === '3' ? 'Third Year' : 
                       student.year === '4' ? 'Fourth Year' : 
                       student.year === '5+' ? 'Fifth Year or Above' : 
                       student.year}
                    </p>
                  </div>
                )}
                {student.section && (
                  <div>
                    <p className="text-sm text-muted-foreground">Section</p>
                    <p className="font-medium">{student.section}</p>
                  </div>
                )}
                {student.gpa && (
                  <div>
                    <p className="text-sm text-muted-foreground">GPA</p>
                    <p className="font-medium">{student.gpa}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileModal;