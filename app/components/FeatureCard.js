import Link from 'next/link';

const FeatureCard = ({ feature }) => {
  const { title, description, icon, link } = feature;

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <Link href={link}>
        <span className="text-indigo-600 font-medium inline-flex items-center cursor-pointer">
          Learn more
          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </span>
      </Link>
    </div>
  );
};

export default FeatureCard;
