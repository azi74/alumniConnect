import React, { useState, useEffect } from 'react';
import api from '@/api';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Users, MessageCircle, Bell, Briefcase, User } from 'lucide-react';
import AlumniDashboard from '@/components/alumni/AlumniDashboard';
import AlumniConnections from '@/components/alumni/AlumniConnections';
import AlumniMentorship from '@/components/alumni/AlumniMentorship';
import { Link } from 'react-router-dom';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { AlumniUser } from '@/types/alumni';

interface Notification {
  _id: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface Message {
  _id: string;
  content: string;
  sender: string;
  createdAt: string;
  read: boolean;
}

interface AlumniData {
  id: string;
  name: string;
  email: string;
  graduationYear: number;
  degree: string;
  currentPosition?: string;
  company?: string;
  skills?: string[];
  experience?: Array<{
    position: string;
    company: string;
    startDate: string;
    endDate?: string;
    currentlyWorking: boolean;
  }>;
}

const AlumniPortal = () => {
  const [user, setUser] = useState<AlumniUser | null>(null);
  const [alumniData, setAlumniData] = useState<AlumniData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check authentication
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch all data in parallel
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [profileRes, notificationsRes, messagesRes] = await Promise.all([
          api.get('/alumni/me'),
          api.get('/notifications'),
          api.get('/messages')
        ]);
    
        setUser(profileRes.data);
        
        // Ensure notifications is always an array
        setNotifications(Array.isArray(notificationsRes.data?.data) 
          ? notificationsRes.data.data 
          : []);
        
        // Ensure messages is always an array
        setMessages(Array.isArray(messagesRes.data?.data) 
          ? messagesRes.data.data 
          : []);
          
      } catch (err) {
        console.error('Error fetching data:', err);
        
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setError(err.response?.data?.message || 'Failed to load portal data');
          // Set empty arrays if there's an error
          setNotifications([]);
          setMessages([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [navigate]);

  // Calculate unread counts
  const unreadNotifications = notifications.filter(n => !n.read).length;
  const unreadMessages = messages.filter(m => !m.read).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <h2 className="text-xl font-bold mb-2">Error Loading Portal</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold">No user data found</h2>
          <Button onClick={() => navigate('/login')} className="mt-4">
            Return to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavigationBar />
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4 md:px-6">
          {/* Welcome Header */}
          <div className="mb-8 p-6 glass-card rounded-xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  Welcome Back, {user.name}
                </h1>
                <p className="text-muted-foreground">
                  {user.profile?.degree} '{user.profile?.graduationYear}' | {user.profile?.currentRole} at {user.profile?.currentCompany || 'your company'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="flex items-center gap-2 focus-ring">
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Notifications</span>
                  {unreadNotifications > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-primary rounded-full">
                      {unreadNotifications}
                    </span>
                  )}
                </Button>
                <Button className="relative flex items-center gap-2 button-transition button-hover focus-ring">
                  <MessageCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Messages</span>
                  {unreadMessages > 0 && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 w-5 h-5 text-xs font-bold text-white bg-primary rounded-full flex items-center justify-center">
                      {unreadMessages}
                    </span>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 focus-ring"
                  asChild
                >
                  <Link to="/alumni-profile">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">My Profile</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Main Tabs Navigation */}
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="w-full mb-8 grid grid-cols-2 md:grid-cols-3 h-auto bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="dashboard" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                <span>Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="connections" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Connections</span>
              </TabsTrigger>
              <TabsTrigger value="mentorship" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span>Mentorship</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-0">
              <AlumniDashboard user={user} />
            </TabsContent>

            <TabsContent value="connections" className="mt-0">
              <AlumniConnections user={user} />
            </TabsContent>
              
            <TabsContent value="mentorship" className="mt-0">
              <AlumniMentorship user={user} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AlumniPortal;