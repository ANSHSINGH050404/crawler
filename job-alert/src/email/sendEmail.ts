import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendJobEmail(to: string, jobs: any[]) {
    if (jobs.length === 0) return;

    const jobList = jobs.map(job => `<li><a href="${job.url}">${job.title} at ${job.company}</a> - ${job.location}</li>`).join('');
    const html = `<h3>New Jobs Matching Your Preferences</h3><ul>${jobList}</ul>`;

    await sgMail.send({
        to,
        from: 'jobs-alert@yourapp.com',
        subject: 'New Job Openings!',
        html,
    });
}
