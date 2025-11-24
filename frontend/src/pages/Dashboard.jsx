import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AcademicCapIcon,
  UserGroupIcon,
  PlayIcon,
  PlusIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { classesAPI, sessionsAPI } from '@/services/api';
import Layout from '@/components/Layout';

const Dashboard = () => {
  // Fetch classes and sessions stats
  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ['classes-stats'],
    queryFn: () => classesAPI.getStats(),
  });

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['sessions-stats'],
    queryFn: () => sessionsAPI.getStats(),
  });

  const stats = [
    {
      name: 'Total Classes',
      value: classesData?.data?.totalClasses || 0,
      icon: AcademicCapIcon,
      color: 'bg-blue-500',
      link: '/classes',
    },
    {
      name: 'Total Students',
      value: classesData?.data?.totalStudents || 0,
      icon: UserGroupIcon,
      color: 'bg-green-500',
      link: '/classes',
    },
    {
      name: 'Total Sessions',
      value: sessionsData?.data?.totalSessions || 0,
      icon: PlayIcon,
      color: 'bg-purple-500',
      link: '/sessions',
    },
    {
      name: 'Active Sessions',
      value: sessionsData?.data?.activeSessions || 0,
      icon: ChartBarIcon,
      color: 'bg-yellow-500',
      link: '/sessions',
    },
  ];

  const recentClasses = classesData?.data?.recentClasses || [];
  const recentSessions = sessionsData?.data?.recentSessions || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">
            Welcome back! Here's an overview of your engagement tracking system.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link
              key={stat.name}
              to={stat.link}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="p-6">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 p-3 rounded-md ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {classesLoading || sessionsLoading ? (
                          <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                        ) : (
                          stat.value
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Quick Actions
            </h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Link
                to="/classes/new"
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create New Class
              </Link>
              <Link
                to="/sessions/new"
                className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Start New Session
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Classes */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Classes
              </h3>
              <Link
                to="/classes"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                View all
              </Link>
            </div>
            <div className="card-body">
              {classesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : recentClasses.length > 0 ? (
                <div className="space-y-3">
                  {recentClasses.map((classItem) => (
                    <Link
                      key={classItem.id}
                      to={`/classes/${classItem.id}`}
                      className="block hover:bg-gray-50 p-2 rounded-md"
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {classItem.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {classItem.subject} • {classItem.section}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {classItem.student_count || 0} students
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No classes yet</p>
                  <Link
                    to="/classes/new"
                    className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Create your first class
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Sessions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Sessions
              </h3>
              <Link
                to="/sessions"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                View all
              </Link>
            </div>
            <div className="card-body">
              {sessionsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : recentSessions.length > 0 ? (
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <Link
                      key={session.id}
                      to={`/sessions/${session.id}`}
                      className="block hover:bg-gray-50 p-2 rounded-md"
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {session.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {session.class_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            session.status === 'active' ? 'bg-green-100 text-green-800' :
                            session.status === 'ended' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No sessions yet</p>
                  <Link
                    to="/sessions/new"
                    className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Start your first session
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">Getting Started with Engagium</h3>
          <p className="text-primary-100 mb-4">
            Track student engagement in your online classes with real-time monitoring and analytics.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="font-medium mb-1">1. Create Classes</h4>
              <p className="text-sm text-primary-100">
                Add your classes and import student rosters
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="font-medium mb-1">2. Start Sessions</h4>
              <p className="text-sm text-primary-100">
                Begin monitoring engagement during class
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="font-medium mb-1">3. View Analytics</h4>
              <p className="text-sm text-primary-100">
                Analyze participation patterns and trends
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;