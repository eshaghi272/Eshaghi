export interface User {
  id: string;
  phone: string;
  nationalCode: string;
  fullName: string;
  email?: string;
  password?: string;
  createdAt: string;
  isAdmin?: boolean;
}

export interface Appointment {
  id: string;
  userId: string;
  phone: string;
  nationalCode: string;
  fullName: string;
  date: string;
  time: string;
  service: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  createdAt: string;
  updatedAt?: string;
}

export interface DataStore {
  users: User[];
  appointments: Appointment[];
}

class DataService {
  private static instance: DataService;
  private data: DataStore;

  private constructor() {
    this.data = this.loadData();
  }

  public static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  private loadData(): DataStore {
  try {
    const saved = localStorage.getItem('dr-tahmineh-data');
    if (saved) {
      const parsed = JSON.parse(saved);
      // اطمینان از وجود کاربر ادمین
      let users = parsed.users || [];
      const adminExists = users.some((u: User) => u.phone === '09120000000');
      
      if (!adminExists) {
        // اضافه کردن ادمین اگر وجود ندارد
        users.push({
          id: 'admin-1',
          phone: '09120000000',
          nationalCode: '1234567890',
          fullName: 'مدیر سیستم',
          email: 'admin@dr-tahmineh.com',
          createdAt: new Date().toISOString(),
          isAdmin: true,
        });
        // ذخیره مجدد
        const newData = { users, appointments: parsed.appointments || [] };
        localStorage.setItem('dr-tahmineh-data', JSON.stringify(newData));
        return newData;
      }
      
      return {
        users: users,
        appointments: parsed.appointments || [],
      };
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  
  // داده‌های پیش‌فرض
  return {
    users: [
      {
        id: 'admin-1',
        phone: '09120000000',
        nationalCode: '1234567890',
        fullName: 'مدیر سیستم',
        email: 'admin@dr-tahmineh.com',
        createdAt: new Date().toISOString(),
        isAdmin: true,
      }
    ],
    appointments: [],
  };
}

  private saveData(): void {
    try {
      localStorage.setItem('dr-tahmineh-data', JSON.stringify(this.data));
      console.log('Data saved successfully');
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  // ===== مدیریت کاربران =====

  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(user => user.id === id);
  }

  public getUserByPhone(phone: string): User | undefined {
    return this.data.users.find(user => user.phone === phone);
  }

  public getUserByNationalCode(nationalCode: string): User | undefined {
    return this.data.users.find(user => user.nationalCode === nationalCode);
  }

  public addUser(userData: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      id: `user-${Date.now()}`,
      ...userData,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.saveData();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const index = this.data.users.findIndex(user => user.id === id);
    if (index === -1) return undefined;
    this.data.users[index] = { ...this.data.users[index], ...updates };
    this.saveData();
    return this.data.users[index];
  }

  public deleteUser(id: string): boolean {
    const index = this.data.users.findIndex(user => user.id === id);
    if (index === -1) return false;
    this.data.users.splice(index, 1);
    this.saveData();
    return true;
  }

  // ===== مدیریت نوبت‌ها =====

  public getAppointments(): Appointment[] {
    if (!this.data.appointments) {
      this.data.appointments = [];
    }
    return this.data.appointments;
  }

  public getAppointmentsByUser(userId: string): Appointment[] {
    return this.data.appointments.filter(app => app.userId === userId);
  }

  public getAppointmentsByPhone(phone: string): Appointment[] {
    return this.data.appointments.filter(app => app.phone === phone);
  }

  public getAppointmentById(id: string): Appointment | undefined {
    return this.data.appointments.find(app => app.id === id);
  }

  public getPendingAppointments(): Appointment[] {
    return this.data.appointments.filter(app => app.status === 'pending');
  }

  // ✅ فقط یک متد addAppointment
  public addAppointment(appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Appointment {
    console.log('📝 Adding appointment for user:', appointmentData.phone);
    
    if (!this.data.appointments) {
      this.data.appointments = [];
    }
    
    const newAppointment: Appointment = {
      id: `app-${Date.now()}`,
      ...appointmentData,
      createdAt: new Date().toISOString(),
    };
    
    this.data.appointments.push(newAppointment);
    this.saveData();
    console.log('✅ Appointment added. Total:', this.data.appointments.length);
    
    return newAppointment;
  }

  public updateAppointment(id: string, updates: Partial<Appointment>): Appointment | undefined {
    const index = this.data.appointments.findIndex(app => app.id === id);
    if (index === -1) return undefined;
    this.data.appointments[index] = { 
      ...this.data.appointments[index], 
      ...updates,
      updatedAt: new Date().toISOString() 
    };
    this.saveData();
    return this.data.appointments[index];
  }

  public deleteAppointment(id: string): boolean {
    const index = this.data.appointments.findIndex(app => app.id === id);
    if (index === -1) return false;
    this.data.appointments.splice(index, 1);
    this.saveData();
    return true;
  }

  public confirmAppointment(id: string): Appointment | undefined {
    return this.updateAppointment(id, { status: 'confirmed' });
  }

  public rejectAppointment(id: string): Appointment | undefined {
    return this.updateAppointment(id, { status: 'rejected' });
  }

  public cancelAppointment(id: string): Appointment | undefined {
    return this.updateAppointment(id, { status: 'cancelled' });
  }

  public completeAppointment(id: string): Appointment | undefined {
    return this.updateAppointment(id, { status: 'completed' });
  }

  // ===== آمار =====

  public getStats() {
    return {
      totalUsers: this.data.users.length,
      totalAppointments: this.data.appointments.length,
      pendingAppointments: this.data.appointments.filter(a => a.status === 'pending').length,
      confirmedAppointments: this.data.appointments.filter(a => a.status === 'confirmed').length,
      completedAppointments: this.data.appointments.filter(a => a.status === 'completed').length,
      cancelledAppointments: this.data.appointments.filter(a => a.status === 'cancelled').length,
      rejectedAppointments: this.data.appointments.filter(a => a.status === 'rejected').length,
    };
  }

  public clearAllData(): void {
    this.data = { users: [], appointments: [] };
    this.saveData();
  }

  // اضافه کردن این متدها به کلاس DataService

// بررسی اینکه کاربر ادمین است
public isAdmin(phone: string): boolean {
  const user = this.getUserByPhone(phone);
  return user?.isAdmin === true;
}

// دریافت همه نوبت‌ها (فقط برای ادمین)
public getAllAppointmentsForAdmin(): Appointment[] {
  return this.data.appointments;
}

// دریافت آمار کامل (فقط برای ادمین)
public getFullStats() {
  const appointments = this.data.appointments;
  return {
    total: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
    rejected: appointments.filter(a => a.status === 'rejected').length,
    byService: {
      consultation: appointments.filter(a => a.service === 'consultation').length,
      followup: appointments.filter(a => a.service === 'followup').length,
      treatment: appointments.filter(a => a.service === 'treatment').length,
      emergency: appointments.filter(a => a.service === 'emergency').length,
    }
  };
}
}

export default DataService.getInstance();