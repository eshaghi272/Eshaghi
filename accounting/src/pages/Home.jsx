const Home = () => {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-4">   خوش آمدید</h1>
        <p className="text-xl text-gray-600">سیستم مدیریت یکپارچه  </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow-sm">
          <div className="text-3xl mb-4">👨‍⚕️</div>
          <h3 className="font-bold text-lg mb-2">مدیریت </h3>
          <p className="text-gray-600">ثبت و مدیریت اطلاعات    </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow-sm">
          <div className="text-3xl mb-4">👥</div>
          <h3 className="font-bold text-lg mb-2">مدیریت </h3>
          <p className="text-gray-600">ثبت   و مدیریت </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg shadow-sm">
          <div className="text-3xl mb-4">📊</div>
          <h3 className="font-bold text-lg mb-2">گزارشات جامع</h3>
          <p className="text-gray-600">گزارشات آماری و تحلیلی از عملکرد </p>
        </div>
      </div>
    </div>
  );
};

export default Home;