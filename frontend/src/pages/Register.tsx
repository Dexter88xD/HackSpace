
import { RegistrationForm } from '../components/RegistrationForm';

function Register() {
    return (
    <div className="flex min-h-vh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <RegistrationForm />
      </div>
    </div>
);
}

export default Register;