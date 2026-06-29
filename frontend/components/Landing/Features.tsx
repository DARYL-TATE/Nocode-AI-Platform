import { 
  FiUploadCloud, 
  FiBarChart2, 
  FiCpu, 
  FiTrendingUp 
} from 'react-icons/fi';

const features = [
  {
    icon: FiUploadCloud,
    title: 'Upload Dataset',
    description: 'Easily upload CSV, Excel files to get started',
    color: 'blue'
  },
  {
    icon: FiBarChart2,
    title: 'Automated Preprocessing',
    description: 'AI-driven tools to clean and prepare your datasets',
    color: 'green'
  },
  {
    icon: FiCpu,
    title: 'Build Models',
    description: 'Create machine learning models with just a few clicks',
    color: 'purple'
  },
  {
    icon: FiTrendingUp,
    title: 'Visualize Results',
    description: 'See insights with interactive charts and graphs',
    color: 'orange'
  }
];

export default function Features() {
  return (
    <div id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">SmartML Features</h2>
          <p className="text-xl text-gray-600">
            Everything you need to build AI models without coding
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="text-center p-6 rounded-xl hover:shadow-lg transition">
                <div className={`inline-flex p-3 rounded-lg bg-${feature.color}-100 mb-4`}>
                  <Icon className={`w-8 h-8 text-${feature.color}-600`} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}