import React from 'react';
import { Connection } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, MapPin, LinkedinIcon, Globe, GraduationCap, Users as UsersIcon } from 'lucide-react';

interface Props {
  student: Connection;
  onClose: () => void;
}

const StudentProfileModal: React.FC<Props> = ({ student, onClose }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-6">
        <div className="w-24 h-24 rounded-full border-4 border-white bg-gray-100 overflow-hidden">
          <img 
            src={student.image} 
            alt={student.name} 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{student.name}</h2>
          <p className="text-muted-foreground">{student.role}</p>
          <p className="text-sm text-muted-foreground">
            {student.program} - {student.year} Year {student.section && `- Section ${student.section}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{student.email || 'Not provided'}</p>
                </div>
              </div>
              
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
            </div>
          </div>

          {student.interests && student.interests.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Academic Interests</h3>
              <div className="flex flex-wrap gap-2">
                {student.interests.map((interest) => (
                  <Badge key={interest} variant="secondary">{interest}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {student.bio && (
            <div className="space-y-2">
              <h3 className="font-semibold">About</h3>
              <p className="text-muted-foreground whitespace-pre-line">{student.bio}</p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold">Academic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Registration Number</p>
                <p className="font-medium">{student.registrationNumber || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Program</p>
                <p className="font-medium">{student.program || 'Not specified'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Year</p>
                <p className="font-medium">
                  {student.year === '1' ? 'First Year' : 
                   student.year === '2' ? 'Second Year' : 
                   student.year === '3' ? 'Third Year' : 
                   student.year === '4' ? 'Fourth Year' : 
                   student.year === '5+' ? 'Fifth Year or Above' : 
                   'Not specified'}
                </p>
              </div>
              {student.section && (
                <div>
                  <p className="text-sm text-muted-foreground">Section</p>
                  <p className="font-medium">{student.section}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onClose}>Close</Button>
      </div>
    </div>
  );
};

export default StudentProfileModal;