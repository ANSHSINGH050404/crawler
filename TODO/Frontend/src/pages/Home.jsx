import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Calendar, Tag, AlertCircle, Search, Menu, LogOut } from 'lucide-react';

const TodoApp = () => {
  // State management
  const [todos, setTodos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [user, setUser] = useState({ name: 'Demo User' }); // Demo user
  const [loading, setLoading] = useState(false);

  const [todoForm, setTodoForm] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    dueDate: '',
    tags: ''
  });

  // Demo data - replace with actual API calls
useEffect(() => {
  const API_BASE = 'http://localhost:3000/todos';

  const fetchTodos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/todos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch todos');
      const data = await response.json();
      setTodos(data);
    } catch (err) {
      console.error(err);
    }
  };

  fetchTodos();
}, []);


  // Form handlers
  const handleSubmit = () => {
    if (!todoForm.title.trim()) return;
    
    setLoading(true);
    
    const newTodo = {
      _id: Date.now().toString(),
      title: todoForm.title,
      description: todoForm.description,
      status: todoForm.status,
      priority: todoForm.priority,
      dueDate: todoForm.dueDate,
      tags: todoForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    };

    if (editingTodo) {
      setTodos(todos.map(todo => 
        todo._id === editingTodo._id ? { ...newTodo, _id: editingTodo._id } : todo
      ));
    } else {
      setTodos([...todos, newTodo]);
    }

    resetForm();
    setLoading(false);
  };

  const handleEdit = (todo) => {
    setTodoForm({
      title: todo.title,
      description: todo.description || '',
      status: todo.status,
      priority: todo.priority,
      dueDate: todo.dueDate || '',
      tags: todo.tags ? todo.tags.join(', ') : ''
    });
    setEditingTodo(todo);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this todo?')) {
      setTodos(todos.filter(todo => todo._id !== id));
    }
  };

  const resetForm = () => {
    setTodoForm({
      title: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      dueDate: '',
      tags: ''
    });
    setEditingTodo(null);
    setIsModalOpen(false);
  };

  // Filter todos
  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || todo.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in-progress': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">My Todos</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                Welcome, {user.name}
              </span>
              <button className="text-red-600 hover:text-red-700 text-sm">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Controls */}
        <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search todos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Filter */}
          <div className="flex space-x-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus size={16} className="mr-2" />
              Add
            </button>
          </div>
        </div>

        {/* Todo Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTodos.map((todo) => (
            <div key={todo._id} className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900 flex-1 mr-2">{todo.title}</h3>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(todo)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(todo._id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              
              {todo.description && (
                <p className="text-gray-600 text-sm mb-3">{todo.description}</p>
              )}
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(todo.status)}`}>
                    {todo.status}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(todo.priority)}`}>
                    {todo.priority}
                  </span>
                </div>
                
                {todo.dueDate && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar size={12} className="mr-1" />
                    {new Date(todo.dueDate).toLocaleDateString()}
                  </div>
                )}
                
                {todo.tags && todo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {todo.tags.map((tag, index) => (
                      <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredTodos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No todos found</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingTodo ? 'Edit Todo' : 'Add Todo'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={todoForm.title}
                  onChange={(e) => setTodoForm({...todoForm, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter title..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={todoForm.description}
                  onChange={(e) => setTodoForm({...todoForm, description: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter description..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={todoForm.status}
                    onChange={(e) => setTodoForm({...todoForm, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <select
                    value={todoForm.priority}
                    onChange={(e) => setTodoForm({...todoForm, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={todoForm.dueDate}
                  onChange={(e) => setTodoForm({...todoForm, dueDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tags</label>
                <input
                  type="text"
                  value={todoForm.tags}
                  onChange={(e) => setTodoForm({...todoForm, tags: e.target.value})}
                  placeholder="work, personal, urgent"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingTodo ? 'Update' : 'Create')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoApp;