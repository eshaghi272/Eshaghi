const Services = () => {
  const services = [
    {
      title: 'توسعه وب',
      description: 'توسعه اپلیکیشن‌های وب مدرن با آخرین تکنولوژی‌ها',
      icon: '💻'
    },
    {
      title: 'طراحی UI/UX',
      description: 'طراحی رابط کاربری زیبا و تجربه کاربری عالی',
      icon: '🎨'
    },
    {
      title: 'مشاوره فنی',
      description: 'مشاوره در زمینه انتخاب تکنولوژی و معماری سیستم',
      icon: '📊'
    }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">خدمات ما</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-4xl mb-4">{service.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
            <p className="text-gray-600">{service.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Services;