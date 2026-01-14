
export type DepartmentType = 
  | 'Igreja Infantil' | 'Grupo de Louvor' | 'Mídia' | 'Técnica' 
  | 'Protocolos' | 'Acolhimento' | 'Assistencia Social' | 'Organização e Eventos' 
  | 'Finanças' | 'Diaconia' | 'Classe de Fundação' | 'Limpeza' 
  | 'Juventude' | 'Evangelização';

export interface User {
  id: string;
  name: string;
  username: string;
  department: DepartmentType;
  role: 'Servo' | 'Líder' | 'Admin';
  joinedAt: string;
  avatar?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorDept: DepartmentType;
  content: string;
  timestamp: string;
  likes: number;
}

export interface Meeting {
  id: string;
  dept: DepartmentType;
  title: string;
  date: string;
  location: string;
}

export interface Child {
  id: string;
  name: string;
  age: number;
  classLevel: 'Jardim' | 'Junior' | 'Sênior';
  joinedAt: string;
  status: 'active' | 'inactive';
}

export interface AttendanceRecord {
  id: string;
  childId: string;
  date: string;
  present: boolean;
}

export type View = 'home' | 'feed' | 'dashboard' | 'department' | 'children' | 'attendance' | 'insights' | 'chatbot' | 'settings';
