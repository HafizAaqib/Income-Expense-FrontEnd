import { Card } from 'antd';
import './contact.css'

const Contact = () => {
  return (
    <div className="container py-4">
      <Card
        title={<h3 className="text-success mb-0"><span className='phoneIcons'>📞</span> Contact Developer</h3>}
        bordered={false}
        className="shadow contact-card"
      >
        <p className="text-muted">
          If you need help or want to report a bug, feel free to reach out anytime:
        </p>

        <ul className="list-unstyled contact-list">
          <li className="mb-3">
            <strong>Email:</strong>{' '}
            <a href="mailto:hafizaqib0207@gmail.com" className="text-decoration-none text-success">
              hafizaqib0207@gmail.com
            </a>
          </li>
          <li>
            <strong>WhatsApp:</strong>{' '}
            <a
              href="https://wa.me/923160048880"
              className="btn btn-success btn-sm ms-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              Chat on WhatsApp
            </a>
          </li>
        </ul>
      </Card>
    </div>
  );
};

export default Contact;
